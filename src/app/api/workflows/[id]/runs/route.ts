import { tasks } from "@trigger.dev/sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUserId, invalid, notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { graphSchema } from "@/lib/schemas";
import { getWorkflow } from "@/lib/workflows";
import type { runWorkflowTask } from "@/trigger/run-workflow";

const startRunSchema = z.object({
  scope: z.enum(["FULL", "PARTIAL", "SINGLE"]).default("FULL"),
  graph: graphSchema,
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return notFound();

  const parsed = startRunSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);

  const run = await prisma.run.create({
    data: { workflowId: id, userId, scope: parsed.data.scope },
  });

  const handle = await tasks.trigger<typeof runWorkflowTask>(
    "run-workflow",
    { dbRunId: run.id, nodes: parsed.data.graph.nodes, edges: parsed.data.graph.edges },
    { tags: [`workflow:${id}`, `run:${run.id}`] },
  );

  await prisma.run.update({ where: { id: run.id }, data: { triggerRunId: handle.id } });

  return NextResponse.json(
    { dbRunId: run.id, triggerRunId: handle.id, publicAccessToken: handle.publicAccessToken },
    { status: 201 },
  );
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return notFound();
  const runs = await prisma.run.findMany({
    where: { workflowId: id },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      scope: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      durationMs: true,
    },
  });
  return NextResponse.json({ runs });
}
