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
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CanvasTopBar } from "./canvas-top-bar";
import { NodePicker } from "./node-picker";
import { CropImageNodeView } from "./nodes/crop-image-node";
import { GeminiNodeView } from "./nodes/gemini-node";
import { RequestInputsNodeView } from "./nodes/request-inputs-node";
import { ResponseNodeView } from "./nodes/response-node";
import { RunSubscriber } from "./run-subscriber";
import { useCanvasStore } from "./store";
import { type AppEdge, type AppNode, createPrePlacedNodes } from "./types";

const nodeTypes = {
  "request-inputs": RequestInputsNodeView,
  "crop-image": CropImageNodeView,
  gemini: GeminiNodeView,
  response: ResponseNodeView,
} as NodeTypes;

function serializeGraph(nodes: AppNode[], edges: AppEdge[]) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
      ...(n.deletable === false ? { deletable: false } : {}),
      ...(n.draggable === false ? { draggable: false } : {}),
      ...(n.connectable === false ? { connectable: false } : {}),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
    })),
  };
}

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
  const isValidConnection = useCanvasStore((s) => s.isValidConnection);
  const setGraph = useCanvasStore((s) => s.setGraph);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const liveRun = useCanvasStore((s) => s.liveRun);
  const startLiveRun = useCanvasStore((s) => s.startLiveRun);
  const clearLiveRun = useCanvasStore((s) => s.clearLiveRun);
  const [saving, setSaving] = useState(false);

  const displayEdges = useMemo(
    () => (liveRun ? edges.map((e) => ({ ...e, animated: true })) : edges),
    [edges, liveRun],
  );

  const startRun = useCallback(async () => {
    const { nodes: n, edges: e } = useCanvasStore.getState();
    const res = await fetch(`/api/workflows/${workflowId}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "FULL", graph: serializeGraph(n, e) }),
    });
    if (!res.ok) return;
    const { dbRunId, triggerRunId, publicAccessToken } = await res.json();
    startLiveRun({ dbRunId, triggerRunId, token: publicAccessToken });
  }, [workflowId, startLiveRun]);

  const stopRun = useCallback(async () => {
    const current = useCanvasStore.getState().liveRun;
    if (current) await fetch(`/api/runs/${current.dbRunId}/cancel`, { method: "POST" }).catch(() => {});
    clearLiveRun();
  }, [clearLiveRun]);

  useEffect(() => {
    const seeded =
      initialGraph.nodes.length > 0 ? initialGraph.nodes : createPrePlacedNodes();
    setGraph(seeded, initialGraph.edges);
  }, [initialGraph, setGraph]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable))
        return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const t = setTimeout(() => {
      setSaving(true);
      void fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: serializeGraph(nodes, edges) }),
      })
        .catch(() => {})
        .finally(() => setSaving(false));
    }, 800);
    return () => clearTimeout(t);
  }, [nodes, edges, workflowId]);

  return (
    <ReactFlowProvider>
      <div className="relative h-full bg-canvas">
        <ReactFlow
          nodes={nodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          deleteKeyCode={["Backspace", "Delete"]}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#d4d4d8" />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
        {saving && (
          <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </div>
        )}
        <CanvasTopBar
          name={name}
          isRunning={!!liveRun}
          onRun={startRun}
          onStop={stopRun}
        />
        <NodePicker />
        {liveRun && (
          <RunSubscriber
            triggerRunId={liveRun.triggerRunId}
            token={liveRun.token}
            dbRunId={liveRun.dbRunId}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}
