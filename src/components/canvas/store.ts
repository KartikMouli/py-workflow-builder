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
import {
  allowsMultipleInputs,
  isValidConnection as checkConnection,
  serializeGraph,
  validateRunInputs,
  withEdgeStyle,
} from "./graph";
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
  workflowId: string;
  toast: string | null;
  liveRun: LiveRun;
  runStarting: boolean;
  runStates: Record<string, NodeRunState>;
  outputs: Record<string, Record<string, unknown>>;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  isValidConnection: (connection: Connection | AppEdge) => boolean;
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  duplicateNode: (id: string, withEdges: boolean) => void;
  toggleNodeLock: (id: string) => void;
  removeNode: (id: string) => void;
  setGraph: (nodes: AppNode[], edges: AppEdge[]) => void;
  undo: () => void;
  redo: () => void;
  setWorkflowId: (id: string) => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  runWorkflow: (scope: "FULL" | "PARTIAL" | "SINGLE", targets?: string[]) => Promise<void>;
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
    workflowId: "",
    toast: null,
    liveRun: null,
    runStarting: false,
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
      const base = allowsMultipleInputs(targetNode, connection.targetHandle)
        ? get().edges
        : get().edges.filter(
            (e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle),
          );
      const next = addEdge({ ...connection }, base);
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

    duplicateNode: (id, withEdges) => {
      const node = get().nodes.find((n) => n.id === id);
      if (!node || node.draggable === false) return;
      commit();
      const newId = `${node.type}-${crypto.randomUUID().slice(0, 8)}`;
      const copy = {
        ...node,
        id: newId,
        position: { x: node.position.x + 48, y: node.position.y + 48 },
        selected: false,
        data: structuredClone(node.data),
      } as AppNode;
      let edges = get().edges;
      if (withEdges) {
        const cloned = get()
          .edges.filter((e) => e.source === id || e.target === id)
          .map((e) => ({
            ...e,
            id: `${e.id}-${crypto.randomUUID().slice(0, 6)}`,
            source: e.source === id ? newId : e.source,
            target: e.target === id ? newId : e.target,
          }));
        edges = [...edges, ...cloned.map((e) => withEdgeStyle(e, [...get().nodes, copy]))];
      }
      set({ nodes: [...get().nodes, copy], edges });
    },

    toggleNodeLock: (id) =>
      set({
        nodes: get().nodes.map((n) => {
          if (n.id !== id) return n;
          const locked = n.draggable === false;
          return locked
            ? { ...n, draggable: true, connectable: true, deletable: true }
            : { ...n, draggable: false, connectable: false, deletable: false };
        }),
      }),

    removeNode: (id) => {
      const node = get().nodes.find((n) => n.id === id);
      if (!node || node.deletable === false) return;
      commit();
      set({
        nodes: get().nodes.filter((n) => n.id !== id),
        edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      });
    },

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

    setWorkflowId: (id) => set({ workflowId: id }),
    showToast: (message) => set({ toast: message }),
    dismissToast: () => set({ toast: null }),

    runWorkflow: async (scope, targets) => {
      const { nodes, edges, workflowId } = get();
      const error = validateRunInputs(nodes, edges, scope, targets);
      if (error) {
        set({ toast: error });
        return;
      }
      set({ runStarting: true });
      try {
        const res = await fetch(`/api/workflows/${workflowId}/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope, targets, graph: serializeGraph(nodes, edges) }),
        });
        if (!res.ok) {
          set({ toast: "Couldn't start the run.", runStarting: false });
          return;
        }
        const { dbRunId, triggerRunId, publicAccessToken } = await res.json();
        set({
          liveRun: { dbRunId, triggerRunId, token: publicAccessToken },
          runStates: {},
          outputs: {},
        });
      } catch {
        set({ toast: "Couldn't start the run.", runStarting: false });
      }
    },

    startLiveRun: (run) => set({ liveRun: run, runStates: {}, outputs: {} }),
    setRunStates: (states) =>
      set(Object.keys(states).length ? { runStates: states, runStarting: false } : { runStates: states }),
    setOutputs: (outputs) => set({ outputs }),
    clearLiveRun: () => set({ liveRun: null, runStarting: false }),
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
