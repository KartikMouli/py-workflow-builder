import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUserId, notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const run = await prisma.run.findFirst({
    where: { id, userId },
    include: { nodeRuns: { orderBy: { startedAt: "asc" } } },
  });
  if (!run) return notFound();
  return NextResponse.json({ run });
}
