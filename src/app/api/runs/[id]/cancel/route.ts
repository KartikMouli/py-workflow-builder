import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk";
import { RunStatus } from "@/generated/prisma/client";
import { currentUserId, notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const run = await prisma.run.findFirst({ where: { id, userId } });
  if (!run) return notFound();
  if (run.triggerRunId) await runs.cancel(run.triggerRunId);

  // Only mark CANCELED if still running, so we don't overwrite a status the
  // orchestrator may have just written.
  await prisma.run.updateMany({
    where: { id, status: RunStatus.RUNNING },
    data: { status: RunStatus.CANCELED, finishedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
