import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUserId, notFound, unauthorized } from "@/lib/api";
import { duplicateWorkflow } from "@/lib/workflows";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const workflow = await duplicateWorkflow(userId, id);
  if (!workflow) return notFound();
  return NextResponse.json({ workflow }, { status: 201 });
}
