import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk";
import { NodeStatus, RunStatus } from "@/generated/prisma/client";
import { currentUserId, notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const run = await prisma.run.findFirst({ where: { id, userId } });
  if (!run) return notFound();
  if (run.triggerRunId) await runs.cancel(run.triggerRunId);

  // Settle immediately for instant UI feedback; the task's onCancel hook is the race-safe
  // backstop. Only touch still-running rows so a status the orchestrator just wrote survives.
  const finishedAt = new Date();
  await prisma.nodeRun.updateMany({
    where: { runId: id, status: { in: [NodeStatus.PENDING, NodeStatus.RUNNING] } },
    data: { status: NodeStatus.SKIPPED, finishedAt },
  });
  await prisma.run.updateMany({
    where: { id, status: RunStatus.RUNNING },
    data: { status: RunStatus.CANCELED, finishedAt },
  });

  return NextResponse.json({ ok: true });
}
