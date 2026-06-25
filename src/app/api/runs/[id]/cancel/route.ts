import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk";
import { currentUserId, notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const run = await prisma.run.findFirst({ where: { id, userId } });
  if (!run) return notFound();
  if (run.triggerRunId) await runs.cancel(run.triggerRunId);

  return NextResponse.json({ ok: true });
}
