import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUserId, notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getWorkflow } from "@/lib/workflows";

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
