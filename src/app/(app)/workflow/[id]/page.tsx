import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import type { AppEdge, AppNode } from "@/components/canvas/types";
import { WorkflowCanvas } from "@/components/canvas/workflow-canvas";
import { getWorkflow } from "@/lib/workflows";

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  const workflow = userId ? await getWorkflow(userId, id) : null;
  if (!workflow) notFound();

  const graph = (workflow.graph as unknown as { nodes?: AppNode[]; edges?: AppEdge[] }) ?? {};

  return (
    <WorkflowCanvas
      workflowId={workflow.id}
      name={workflow.name}
      initialGraph={{ nodes: graph.nodes ?? [], edges: graph.edges ?? [] }}
    />
  );
}
