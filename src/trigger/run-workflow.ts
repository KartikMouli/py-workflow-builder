import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { metadata, task } from "@trigger.dev/sdk";
import { NodeStatus, type Prisma, RunStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type GraphNode = { id: string; type?: string; data?: Record<string, unknown> };
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};
type RunWorkflowPayload = {
  dbRunId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type NodeOutput = Record<string, unknown>;
type NodeState = { status: NodeStatus; error?: string; durationMs?: number; text?: string };

const CROP_MIN_WAIT_MS = 30_000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadImageBuffer(source: string): Promise<{ buffer: Buffer; mime: string }> {
  if (source.startsWith("data:")) {
    const [header, b64] = source.split(",", 2);
    const mime = header.slice(5, header.indexOf(";")) || "image/png";
    return { buffer: Buffer.from(b64, "base64"), mime };
  }
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const mime = res.headers.get("content-type") ?? "image/png";
  return { buffer: Buffer.from(await res.arrayBuffer()), mime };
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = process.env.FFMPEG_PATH ?? "ffmpeg";
    const proc = spawn(bin, args);
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`)),
    );
  });
}

async function cropImage(source: string, x: number, y: number, w: number, h: number): Promise<string> {
  const { buffer } = await loadImageBuffer(source);
  const dir = await mkdtemp(join(tmpdir(), "crop-"));
  const inPath = join(dir, "in");
  const outPath = join(dir, "out.png");
  await writeFile(inPath, buffer);
  const clamp = (n: number) => Math.min(100, Math.max(0, n)) / 100;
  await runFfmpeg([
    "-y",
    "-i",
    inPath,
    "-vf",
    `crop=iw*${clamp(w)}:ih*${clamp(h)}:iw*${clamp(x)}:ih*${clamp(y)}`,
    outPath,
  ]);
  const out = await readFile(outPath);
  return `data:image/png;base64,${out.toString("base64")}`;
}

async function runGemini(
  model: string,
  prompt: string,
  systemPrompt: string | undefined,
  imageUrl: string | undefined,
): Promise<string> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  const client = new GoogleGenerativeAI(key);
  const generative = client.getGenerativeModel({
    model,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  });
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];
  if (imageUrl) {
    const { buffer, mime } = await loadImageBuffer(imageUrl);
    parts.push({ inlineData: { mimeType: mime, data: buffer.toString("base64") } });
  }
  const result = await generative.generateContent(parts);
  return result.response.text();
}

export const runWorkflowTask = task({
  id: "run-workflow",
  run: async (payload: RunWorkflowPayload) => {
    const { dbRunId, nodes, edges } = payload;
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const outputs: Record<string, NodeOutput> = {};
    const state: Record<string, NodeState> = {};

    const publish = async () => {
      metadata.set("nodes", state);
      await metadata.flush();
    };

    function resolveInput<T>(nodeId: string, handleId: string, fallback: T): T | unknown {
      const edge = edges.find((e) => e.target === nodeId && e.targetHandle === handleId);
      if (edge) return outputs[edge.source]?.[edge.sourceHandle ?? "default"];
      return fallback;
    }

    async function execNode(node: GraphNode): Promise<NodeOutput> {
      const data = node.data ?? {};
      switch (node.type) {
        case "request-inputs": {
          const fields = (data.fields as Array<{ id: string; value?: string }>) ?? [];
          return Object.fromEntries(fields.map((f) => [f.id, f.value ?? ""]));
        }
        case "crop-image": {
          const image = resolveInput(node.id, "input-image", data.inputImageUrl) as string;
          if (!image) throw new Error("Crop Image has no input image");
          const num = (k: string, d: number) => Number(resolveInput(node.id, k, data[k] ?? d));
          await delay(CROP_MIN_WAIT_MS);
          const url = await cropImage(image, num("x", 0), num("y", 0), num("width", 100), num("height", 100));
          return { "output-image": url };
        }
        case "gemini": {
          const prompt = resolveInput(node.id, "prompt", data.prompt) as string;
          if (!prompt) throw new Error("Gemini has no prompt");
          const system = resolveInput(node.id, "system-prompt", data.systemPrompt) as
            | string
            | undefined;
          const image = resolveInput(node.id, "image", data.imageUrl) as string | undefined;
          const text = await runGemini(
            (data.model as string) ?? "gemini-3-flash-preview",
            prompt,
            system,
            image,
          );
          state[node.id] = { ...state[node.id], text };
          return { response: text };
        }
        case "response": {
          const incoming = edges.filter((e) => e.target === node.id && e.targetHandle === "result");
          const collected: Record<string, unknown> = {};
          for (const e of incoming) {
            collected[e.source] = outputs[e.source]?.[e.sourceHandle ?? "default"];
          }
          const text = Object.values(collected)
            .filter((v): v is string => typeof v === "string" && !v.startsWith("data:"))
            .join("\n\n");
          if (text) state[node.id] = { ...state[node.id], text };
          return collected;
        }
        default:
          return {};
      }
    }

    const memo = new Map<string, Promise<NodeOutput>>();
    function schedule(nodeId: string): Promise<NodeOutput> {
      const existing = memo.get(nodeId);
      if (existing) return existing;
      const promise = (async () => {
        const node = nodeById.get(nodeId);
        if (!node) return {};
        const parents = [...new Set(edges.filter((e) => e.target === nodeId).map((e) => e.source))];
        await Promise.all(parents.map(schedule));
        const startedAt = Date.now();
        state[nodeId] = { ...state[nodeId], status: NodeStatus.RUNNING };
        await publish();
        try {
          const out = await execNode(node);
          outputs[nodeId] = out;
          state[nodeId] = { ...state[nodeId], status: NodeStatus.SUCCESS, durationMs: Date.now() - startedAt };
          await publish();
          return out;
        } catch (err) {
          state[nodeId] = {
            ...state[nodeId],
            status: NodeStatus.FAILED,
            error: err instanceof Error ? err.message : String(err),
            durationMs: Date.now() - startedAt,
          };
          await publish();
          throw err;
        }
      })();
      memo.set(nodeId, promise);
      return promise;
    }

    const settled = await Promise.allSettled(nodes.map((n) => schedule(n.id)));
    const failed = settled.some((s) => s.status === "rejected");

    await prisma.$transaction([
      prisma.run.update({
        where: { id: dbRunId },
        data: {
          status: failed ? RunStatus.FAILED : RunStatus.SUCCESS,
          finishedAt: new Date(),
        },
      }),
      prisma.nodeRun.createMany({
        data: nodes.map((n) => ({
          runId: dbRunId,
          nodeId: n.id,
          nodeType: n.type ?? "unknown",
          status: state[n.id]?.status ?? NodeStatus.PENDING,
          output: outputs[n.id] as Prisma.InputJsonValue | undefined,
          error: state[n.id]?.error,
          durationMs: state[n.id]?.durationMs,
        })),
      }),
    ]);

    return { ok: !failed, dbRunId };
  },
});
