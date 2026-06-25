import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { currentUserId, invalid, notFound, unauthorized } from "@/lib/api";
import { updateWorkflowSchema } from "@/lib/schemas";
import { deleteWorkflow, getWorkflow, updateWorkflow } from "@/lib/workflows";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return notFound();
  return NextResponse.json({ workflow });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const parsed = updateWorkflowSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);
  const workflow = await updateWorkflow(userId, id, {
    name: parsed.data.name,
    graph: parsed.data.graph as unknown as Prisma.InputJsonValue | undefined,
  });
  if (!workflow) return notFound();
  return NextResponse.json({ workflow });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const ok = await deleteWorkflow(userId, id);
  if (!ok) return notFound();
  return NextResponse.json({ ok: true });
}
