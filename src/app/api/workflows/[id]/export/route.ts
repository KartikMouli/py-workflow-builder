import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUserId, notFound, unauthorized } from "@/lib/api";
import type { Graph } from "@/lib/schemas";
import { getWorkflow } from "@/lib/workflows";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return notFound();

  const graph = (workflow.graph as unknown as Graph) ?? { nodes: [], edges: [] };
  const payload = {
    version: 1 as const,
    name: workflow.name,
    nodes: graph.nodes ?? [],
    edges: graph.edges ?? [],
  };
  const filename = `${workflow.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "workflow"}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
