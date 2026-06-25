"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { useEffect } from "react";
import { CanvasTopBar } from "./canvas-top-bar";
import { NodePicker } from "./node-picker";
import { CropImageNodeView } from "./nodes/crop-image-node";
import { GeminiNodeView } from "./nodes/gemini-node";
import { RequestInputsNodeView } from "./nodes/request-inputs-node";
import { ResponseNodeView } from "./nodes/response-node";
import { useCanvasStore } from "./store";
import { type AppEdge, type AppNode, createPrePlacedNodes } from "./types";

const nodeTypes = {
  "request-inputs": RequestInputsNodeView,
  "crop-image": CropImageNodeView,
  gemini: GeminiNodeView,
  response: ResponseNodeView,
} as NodeTypes;

export function WorkflowCanvas({
  name,
  initialGraph,
}: {
  workflowId: string;
  name: string;
  initialGraph: { nodes: AppNode[]; edges: AppEdge[] };
}) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const setGraph = useCanvasStore((s) => s.setGraph);

  useEffect(() => {
    const seeded =
      initialGraph.nodes.length > 0 ? initialGraph.nodes : createPrePlacedNodes();
    setGraph(seeded, initialGraph.edges);
  }, [initialGraph, setGraph]);

  return (
    <ReactFlowProvider>
      <div className="flex h-full flex-col">
        <CanvasTopBar name={name} />
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ animated: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#d4d4d8" />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
          <NodePicker />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
