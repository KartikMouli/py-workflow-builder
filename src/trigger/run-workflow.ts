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
  scope?: "FULL" | "PARTIAL" | "SINGLE";
  targets?: string[];
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
  images: string[],
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
  // Vision accepts multiple images — every connection on the Image handle is attached.
  for (const url of images) {
    const { buffer, mime } = await loadImageBuffer(url);
    parts.push({ inlineData: { mimeType: mime, data: buffer.toString("base64") } });
  }
  const result = await generative.generateContent(parts);
  return result.response.text();
}

export const runWorkflowTask = task({
  id: "run-workflow",
  run: async (payload: RunWorkflowPayload) => {
    const runStart = Date.now();
    const { dbRunId, nodes, edges } = payload;
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const outputs: Record<string, NodeOutput> = {};
    const nodeInputs: Record<string, NodeOutput> = {};
    const state: Record<string, NodeState> = {};

    // Compact a value for the persisted "inputs used" record — large base64 blobs become a
    // short tag so node-run rows stay small while still showing what fed each node.
    const summarize = (v: unknown): unknown => {
      if (typeof v === "string") {
        if (v.startsWith("data:")) return `[${v.slice(5, v.indexOf(";")) || "binary"}]`;
        if (v.startsWith("http")) return v;
        return v.length > 400 ? `${v.slice(0, 400)}…` : v;
      }
      if (Array.isArray(v)) return v.map(summarize);
      return v;
    };

    // Serialize flushes so parallel branches don't race: concurrent metadata.flush()
    // calls can land out of order and drop a node's RUNNING frame. Each publish
    // snapshots the state at call-time so its frame is preserved in order.
    let publishChain: Promise<void> = Promise.resolve();
    const publish = () => {
      const snapshot = structuredClone(state);
      publishChain = publishChain.then(async () => {
        metadata.set("nodes", snapshot);
        await metadata.flush();
      }, () => {});
      return publishChain;
    };

    function resolveInput<T>(nodeId: string, handleId: string, fallback: T): T | unknown {
      const edge = edges.find((e) => e.target === nodeId && e.targetHandle === handleId);
      if (edge) {
        const value = outputs[edge.source]?.[edge.sourceHandle ?? "default"];
        if (value !== undefined && value !== null && value !== "") return value;
      }
      return fallback;
    }

    // Collect every connection on a handle (vision accepts multiple); fall back to a manual value.
    function resolveAll(nodeId: string, handleId: string, fallback: string | undefined): string[] {
      const fromEdges = edges
        .filter((e) => e.target === nodeId && e.targetHandle === handleId)
        .map((e) => outputs[e.source]?.[e.sourceHandle ?? "default"])
        .filter((v): v is string => typeof v === "string" && v !== "");
      if (fromEdges.length) return fromEdges;
      return fallback ? [fallback] : [];
    }

    async function execNode(node: GraphNode): Promise<NodeOutput> {
      const data = node.data ?? {};
      switch (node.type) {
        case "request-inputs": {
          const fields = (data.fields as Array<{ id: string; name?: string; value?: string }>) ?? [];
          const out = Object.fromEntries(fields.map((f) => [f.id, f.value ?? ""]));
          nodeInputs[node.id] = Object.fromEntries(
            fields.map((f) => [f.name ?? f.id, summarize(f.value ?? "")]),
          );
          return out;
        }
        case "crop-image": {
          const image = resolveInput(node.id, "input-image", data.inputImageUrl) as string;
          if (!image) throw new Error("Crop Image has no input image");
          const num = (k: string, d: number) => Number(resolveInput(node.id, k, data[k] ?? d));
          const [x, y, w, h] = [num("x", 0), num("y", 0), num("width", 100), num("height", 100)];
          nodeInputs[node.id] = { "input-image": summarize(image), x, y, width: w, height: h };
          await delay(CROP_MIN_WAIT_MS);
          const url = await cropImage(image, x, y, w, h);
          return { "output-image": url };
        }
        case "gemini": {
          const prompt = resolveInput(node.id, "prompt", data.prompt) as string;
          if (!prompt) throw new Error("Gemini has no prompt");
          const system = resolveInput(node.id, "system-prompt", data.systemPrompt) as
            | string
            | undefined;
          const images = resolveAll(node.id, "image", data.imageUrl as string | undefined);
          nodeInputs[node.id] = {
            prompt: summarize(prompt),
            ...(system ? { "system-prompt": summarize(system) } : {}),
            ...(images.length ? { image: images.map(summarize) } : {}),
          };
          const text = await runGemini(
            (data.model as string) ?? "gemini-3-flash-preview",
            prompt,
            system,
            images,
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
          nodeInputs[node.id] = Object.fromEntries(
            Object.entries(collected).map(([k, v]) => [k, summarize(v)]),
          );
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

    // SINGLE/PARTIAL runs execute only the targeted node(s) — a node depends only on parents
    // that are themselves in the run set, so unselected upstream nodes are never re-run.
    const scope = payload.scope ?? "FULL";
    const targetSet = new Set(payload.targets ?? []);
    function directParents(nodeId: string): string[] {
      const all = [...new Set(edges.filter((e) => e.target === nodeId).map((e) => e.source))];
      return scope === "FULL" ? all : all.filter((p) => targetSet.has(p));
    }
    const memo = new Map<string, Promise<NodeOutput>>();
    function schedule(nodeId: string): Promise<NodeOutput> {
      const existing = memo.get(nodeId);
      if (existing) return existing;
      const promise = (async () => {
        const node = nodeById.get(nodeId);
        if (!node) return {};
        await Promise.all(directParents(nodeId).map(schedule));
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

    const rootIds = payload.targets?.length ? payload.targets : nodes.map((n) => n.id);

    // Mark every node that will run as PENDING up front so the UI shows queued badges.
    const scopeIds = new Set<string>();
    const collectScope = (nodeId: string) => {
      if (scopeIds.has(nodeId)) return;
      scopeIds.add(nodeId);
      for (const p of directParents(nodeId)) collectScope(p);
    };
    rootIds.forEach(collectScope);
    for (const id of scopeIds) state[id] = { status: NodeStatus.PENDING };
    await publish();

    await Promise.allSettled(rootIds.map((id) => schedule(id)));
    await publishChain;
    const ranNodes = nodes.filter((n) => state[n.id]);

    // Mixed outcomes → PARTIAL; all failed → FAILED; otherwise SUCCESS.
    const statuses = ranNodes.map((n) => state[n.id]?.status);
    const anyFailed = statuses.includes(NodeStatus.FAILED);
    const anySucceeded = statuses.includes(NodeStatus.SUCCESS);
    const runStatus = anyFailed
      ? anySucceeded
        ? RunStatus.PARTIAL
        : RunStatus.FAILED
      : RunStatus.SUCCESS;

    await prisma.$transaction([
      prisma.run.update({
        where: { id: dbRunId },
        data: { status: runStatus, finishedAt: new Date(), durationMs: Date.now() - runStart },
      }),
      prisma.nodeRun.createMany({
        data: ranNodes.map((n) => ({
          runId: dbRunId,
          nodeId: n.id,
          nodeType: n.type ?? "unknown",
          status: state[n.id]?.status ?? NodeStatus.PENDING,
          inputs: nodeInputs[n.id] as Prisma.InputJsonValue | undefined,
          output: outputs[n.id] as Prisma.InputJsonValue | undefined,
          error: state[n.id]?.error,
          durationMs: state[n.id]?.durationMs,
        })),
      }),
    ]);

    return { ok: !anyFailed, dbRunId };
  },
});
