import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { currentUserId, invalid, unauthorized } from "@/lib/api";
import { importWorkflowSchema } from "@/lib/schemas";
import { createImportedWorkflow } from "@/lib/workflows";

export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const parsed = importWorkflowSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);
  const graph = {
    nodes: parsed.data.nodes,
    edges: parsed.data.edges,
  } as unknown as Prisma.InputJsonValue;
  const workflow = await createImportedWorkflow(userId, parsed.data.name, graph);
  return NextResponse.json({ workflow }, { status: 201 });
}
