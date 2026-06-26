"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { CropImageNodeView } from "@/components/canvas/nodes/crop-image-node";
import { GeminiNodeView } from "@/components/canvas/nodes/gemini-node";
import { RequestInputsNodeView } from "@/components/canvas/nodes/request-inputs-node";
import { ResponseNodeView } from "@/components/canvas/nodes/response-node";
import { StickyNoteNodeView } from "@/components/canvas/nodes/sticky-note-node";
import { useCanvasStore } from "@/components/canvas/store";
import type { AppEdge, AppNode } from "@/components/canvas/types";

type Graph = { nodes: AppNode[]; edges: AppEdge[] };

const nodeTypes = {
  "request-inputs": RequestInputsNodeView,
  "crop-image": CropImageNodeView,
  gemini: GeminiNodeView,
  response: ResponseNodeView,
  "sticky-note": StickyNoteNodeView,
} as NodeTypes;

function WorkflowPreview({ graph }: { graph: Graph }) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const setGraph = useCanvasStore((s) => s.setGraph);

  useEffect(() => {
    setGraph(graph.nodes, graph.edges);
  }, [graph, setGraph]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#d4d4d8" />
    </ReactFlow>
  );
}

export function WorkflowTab({ workflowId, graph }: { workflowId: string; graph: Graph }) {
  return (
    <div className="h-full p-6">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Workflow Structure</h2>
          <Link
            href={`/workflow/${workflowId}/edit`}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />
            Edit Workflow
          </Link>
        </div>
        <div className="border-t border-gray-200" />
        <div className="min-h-0 flex-1 bg-canvas">
          <ReactFlowProvider>
            <WorkflowPreview graph={graph} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
