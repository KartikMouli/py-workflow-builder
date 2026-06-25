import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUserId, invalid, unauthorized } from "@/lib/api";
import { createWorkflowSchema } from "@/lib/schemas";
import { createWorkflow, listWorkflows } from "@/lib/workflows";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const workflows = await listWorkflows(userId);
  return NextResponse.json({ workflows });
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const parsed = createWorkflowSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);
  const workflow = await createWorkflow(userId, parsed.data.name);
  return NextResponse.json({ workflow }, { status: 201 });
}
