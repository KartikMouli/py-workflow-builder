"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { withEdgeStyle } from "@/components/canvas/graph";
import type { AppEdge, AppNode } from "@/components/canvas/types";

type Graph = { nodes: AppNode[]; edges: AppEdge[] };
type PreviewData = { label: string; sticky?: string };

const TITLE: Record<string, string> = {
  "request-inputs": "Request-Inputs",
  "crop-image": "Crop Image",
  gemini: "Gemini 3 Flash",
  response: "Response",
};

const MAP_COLOR: Record<string, string> = {
  gemini: "#22c55e",
  "crop-image": "#3b82f6",
  "request-inputs": "#9ca3af",
  response: "#6058e8",
  "sticky-note": "#f59e0b",
};

function previewLabel(node: AppNode): string {
  if (node.type === "sticky-note") return node.data.text?.trim() || "Note";
  return TITLE[node.type ?? ""] ?? node.type ?? "Node";
}

const handleStyle = {
  width: 8,
  height: 8,
  background: "#cbd5e1",
  border: "2px solid #fff",
};

function PreviewNode({ data }: NodeProps<Node<PreviewData>>) {
  if (data.sticky !== undefined) {
    return (
      <div className="max-w-52 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm">
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <span className="line-clamp-3 whitespace-pre-wrap">{data.sticky || "Note"}</span>
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </div>
    );
  }
  return (
    <div className="w-48 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <span className="text-sm font-semibold text-gray-800">{data.label}</span>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}

const nodeTypes = { preview: PreviewNode };

function WorkflowPreview({ graph }: { graph: Graph }) {
  const nodes = useMemo<Node<PreviewData>[]>(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: "preview",
        position: n.position,
        draggable: false,
        data:
          n.type === "sticky-note"
            ? { label: "Note", sticky: n.data.text ?? "" }
            : { label: previewLabel(n) },
      })),
    [graph],
  );

  // Strip specific handles so edges connect to each preview node's single
  // left/right handle, while keeping the editor's per-type stroke colors.
  const edges = useMemo(
    () =>
      graph.edges.map((e) => {
        const styled = withEdgeStyle(e, graph.nodes);
        return { id: e.id, source: e.source, target: e.target, style: styled.style };
      }),
    [graph],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#d4d4d8" />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n: Node) => MAP_COLOR[graph.nodes.find((g) => g.id === n.id)?.type ?? ""] ?? "#9ca3af"}
        nodeStrokeColor="transparent"
        className="rounded-lg! border! border-gray-200!"
      />
    </ReactFlow>
  );
}

export function WorkflowTab({ workflowId, graph }: { workflowId: string; graph: Graph }) {
  return (
    <div className="mx-auto max-w-6xl px-8 py-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {graph.nodes.length} node{graph.nodes.length === 1 ? "" : "s"} · {graph.edges.length}{" "}
          connection{graph.edges.length === 1 ? "" : "s"}
        </p>
        <Link
          href={`/workflow/${workflowId}/edit`}
          className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          <Pencil className="h-4 w-4" />
          Edit Workflow
        </Link>
      </div>

      <div className="mt-4 h-150 overflow-hidden rounded-2xl border border-gray-200 bg-canvas">
        <ReactFlowProvider>
          <WorkflowPreview graph={graph} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
