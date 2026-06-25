import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { useMemo } from "react";
import { create } from "zustand";
import { allowsMultipleInputs, isValidConnection as checkConnection, withEdgeStyle } from "./graph";
import type { AppEdge, AppNode } from "./types";

type Snapshot = { nodes: AppNode[]; edges: AppEdge[] };

export type NodeRunState = { status?: string; error?: string; durationMs?: number; text?: string };

type LiveRun = { dbRunId: string; triggerRunId: string; token: string } | null;

type CanvasState = {
  nodes: AppNode[];
  edges: AppEdge[];
  past: Snapshot[];
  future: Snapshot[];
  dragging: boolean;
  liveRun: LiveRun;
  runStates: Record<string, NodeRunState>;
  outputs: Record<string, Record<string, unknown>>;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  isValidConnection: (connection: Connection | AppEdge) => boolean;
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  setGraph: (nodes: AppNode[], edges: AppEdge[]) => void;
  undo: () => void;
  redo: () => void;
  startLiveRun: (run: NonNullable<LiveRun>) => void;
  setRunStates: (states: Record<string, NodeRunState>) => void;
  setOutputs: (outputs: Record<string, Record<string, unknown>>) => void;
  clearLiveRun: () => void;
};

const HISTORY_LIMIT = 50;

export const useCanvasStore = create<CanvasState>((set, get) => {
  const commit = () =>
    set((s) => ({ past: [...s.past, { nodes: s.nodes, edges: s.edges }].slice(-HISTORY_LIMIT), future: [] }));

  return {
    nodes: [],
    edges: [],
    past: [],
    future: [],
    dragging: false,
    liveRun: null,
    runStates: {},
    outputs: {},

    onNodesChange: (changes) => {
      const removing = changes.some((c) => c.type === "remove");
      const dragStart = !get().dragging && changes.some((c) => c.type === "position" && c.dragging);
      const dragEnd =
        get().dragging && changes.some((c) => c.type === "position" && c.dragging === false);
      if (removing || dragStart) commit();
      if (dragStart) set({ dragging: true });
      else if (dragEnd) set({ dragging: false });
      set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    onEdgesChange: (changes) => {
      if (changes.some((c) => c.type === "remove")) commit();
      set({ edges: applyEdgeChanges(changes, get().edges) });
    },

    onConnect: (connection) => {
      if (!checkConnection(connection, get().nodes, get().edges)) return;
      commit();
      const targetNode = get().nodes.find((n) => n.id === connection.target);
      const base = allowsMultipleInputs(targetNode)
        ? get().edges
        : get().edges.filter(
            (e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle),
          );
      const next = addEdge({ ...connection, animated: true }, base);
      set({ edges: next.map((e) => withEdgeStyle(e, get().nodes)) });
    },

    isValidConnection: (connection) => checkConnection(connection, get().nodes, get().edges),

    addNode: (node) => {
      commit();
      set({ nodes: [...get().nodes, node] });
    },

    updateNodeData: (id, patch) =>
      set({
        nodes: get().nodes.map((n) =>
          n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as AppNode) : n,
        ),
      }),

    setGraph: (nodes, edges) =>
      set({ nodes, edges: edges.map((e) => withEdgeStyle(e, nodes)), past: [], future: [] }),

    undo: () => {
      const { past } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      set((s) => ({
        nodes: prev.nodes,
        edges: prev.edges,
        past: past.slice(0, -1),
        future: [{ nodes: s.nodes, edges: s.edges }, ...s.future].slice(0, HISTORY_LIMIT),
      }));
    },

    redo: () => {
      const { future } = get();
      if (future.length === 0) return;
      const next = future[0];
      set((s) => ({
        nodes: next.nodes,
        edges: next.edges,
        future: future.slice(1),
        past: [...s.past, { nodes: s.nodes, edges: s.edges }].slice(-HISTORY_LIMIT),
      }));
    },

    startLiveRun: (run) => set({ liveRun: run, runStates: {}, outputs: {} }),
    setRunStates: (states) => set({ runStates: states }),
    setOutputs: (outputs) => set({ outputs }),
    clearLiveRun: () => set({ liveRun: null }),
  };
});

export function useConnectedTargets(nodeId: string): Set<string> {
  const edges = useCanvasStore((s) => s.edges);
  return useMemo(
    () =>
      new Set(
        edges.filter((e) => e.target === nodeId && e.targetHandle).map((e) => e.targetHandle as string),
      ),
    [edges, nodeId],
  );
}
