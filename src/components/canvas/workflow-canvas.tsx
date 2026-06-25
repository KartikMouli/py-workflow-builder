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
  workflowId,
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

  useEffect(() => {
    if (nodes.length === 0) return;
    const t = setTimeout(() => {
      const cleanNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
        ...(n.deletable === false ? { deletable: false } : {}),
      }));
      const cleanEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
      }));
      void fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: { nodes: cleanNodes, edges: cleanEdges } }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [nodes, edges, workflowId]);

  return (
    <ReactFlowProvider>
      <div className="relative h-full bg-canvas">
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
        <CanvasTopBar name={name} />
        <NodePicker />
      </div>
    </ReactFlowProvider>
  );
}
