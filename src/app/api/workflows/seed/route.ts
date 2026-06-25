import { NextResponse } from "next/server";
import { currentUserId, unauthorized } from "@/lib/api";
import { TRIAL_TASK_WORKFLOW, trialTaskGraph } from "@/lib/templates";
import { createImportedWorkflow } from "@/lib/workflows";

export async function POST() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const workflow = await createImportedWorkflow(userId, TRIAL_TASK_WORKFLOW.name, trialTaskGraph);
  return NextResponse.json({ workflow }, { status: 201 });
}
