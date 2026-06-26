"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasControls, CanvasMinimap } from "./canvas-controls";
import { CanvasTopBar } from "./canvas-top-bar";
import { serializeGraph } from "./graph";
import { NodePicker } from "./node-picker";
import { CropImageNodeView } from "./nodes/crop-image-node";
import { GeminiNodeView } from "./nodes/gemini-node";
import { RequestInputsNodeView } from "./nodes/request-inputs-node";
import { ResponseNodeView } from "./nodes/response-node";
import { StickyNoteNodeView } from "./nodes/sticky-note-node";
import { RunHistoryPanel } from "./run-history-panel";
import { RunSubscriber } from "./run-subscriber";
import { useCanvasStore } from "./store";
import { type AppEdge, type AppNode, createPrePlacedNodes } from "./types";

const nodeTypes = {
  "request-inputs": RequestInputsNodeView,
  "crop-image": CropImageNodeView,
  gemini: GeminiNodeView,
  response: ResponseNodeView,
  "sticky-note": StickyNoteNodeView,
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
  const isValidConnection = useCanvasStore((s) => s.isValidConnection);
  const setGraph = useCanvasStore((s) => s.setGraph);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const liveRun = useCanvasStore((s) => s.liveRun);
  const runWorkflow = useCanvasStore((s) => s.runWorkflow);
  const setWorkflowId = useCanvasStore((s) => s.setWorkflowId);
  const clearLiveRun = useCanvasStore((s) => s.clearLiveRun);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [historyOpen, setHistoryOpen] = useState(false);
  const pendingBody = useRef<string | null>(null);

  const displayEdges = useMemo(
    () => (liveRun ? edges.map((e) => ({ ...e, animated: true })) : edges),
    [edges, liveRun],
  );

  const startRun = useCallback(() => runWorkflow("FULL"), [runWorkflow]);

  const stopRun = useCallback(async () => {
    const current = useCanvasStore.getState().liveRun;
    if (current) await fetch(`/api/runs/${current.dbRunId}/cancel`, { method: "POST" }).catch(() => {});
    clearLiveRun();
  }, [clearLiveRun]);

  useEffect(() => {
    setWorkflowId(workflowId);
    const seeded =
      initialGraph.nodes.length > 0 ? initialGraph.nodes : createPrePlacedNodes();
    setGraph(seeded, initialGraph.edges);
  }, [initialGraph, setGraph, setWorkflowId, workflowId]);

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
    const body = JSON.stringify({ graph: serializeGraph(nodes, edges) });
    pendingBody.current = body;
    const t = setTimeout(() => {
      setSaveState("saving");
      fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
      })
        .then((r) => {
          if (r.ok) pendingBody.current = null;
          setSaveState(r.ok ? "saved" : "error");
        })
        .catch(() => setSaveState("error"));
    }, 800);
    return () => clearTimeout(t);
  }, [nodes, edges, workflowId]);

  useEffect(() => {
    if (saveState !== "saved" && saveState !== "error") return;
    const t = setTimeout(() => setSaveState("idle"), saveState === "error" ? 4000 : 1500);
    return () => clearTimeout(t);
  }, [saveState]);

  // Flush the last pending change when navigating away or reloading mid-debounce.
  useEffect(() => {
    const flush = () => {
      if (!pendingBody.current) return;
      void fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: pendingBody.current,
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [workflowId]);

  return (
    <ReactFlowProvider>
      <div className="flex h-full">
        <div className="relative h-full min-w-0 flex-1 bg-canvas">
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
            <CanvasControls />
            <CanvasMinimap />
          </ReactFlow>
          {saveState !== "idle" && (
            <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-sm">
              {saveState === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
                  <span className="text-gray-500">Saving…</span>
                </>
              )}
              {saveState === "saved" && (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="font-medium text-green-600">Saved</span>
                </>
              )}
              {saveState === "error" && (
                <>
                  <TriangleAlert className="h-3.5 w-3.5 text-red-600" />
                  <span className="font-medium text-red-600">Save failed</span>
                </>
              )}
            </div>
          )}
          <CanvasTopBar
            name={name}
            isRunning={!!liveRun}
            onRun={startRun}
            onStop={stopRun}
            onHistory={() => setHistoryOpen((v) => !v)}
          />
          <NodePicker />
          <CanvasToast />
          {liveRun && (
            <RunSubscriber
              triggerRunId={liveRun.triggerRunId}
              token={liveRun.token}
              dbRunId={liveRun.dbRunId}
            />
          )}
        </div>
        <RunHistoryPanel
          open={historyOpen}
          workflowId={workflowId}
          activeRunId={liveRun?.dbRunId ?? null}
          onClose={() => setHistoryOpen(false)}
        />
      </div>
    </ReactFlowProvider>
  );
}

function CanvasToast() {
  const toast = useCanvasStore((s) => s.toast);
  const dismissToast = useCanvasStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 4000);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;
  return (
    <button
      type="button"
      onClick={dismissToast}
      className="absolute bottom-20 left-6 z-20 max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-800 shadow-lg"
    >
      {toast}
    </button>
  );
}
