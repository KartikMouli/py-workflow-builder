import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import type { AppEdge, AppNode } from "./types";

type CanvasState = {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  setGraph: (nodes: AppNode[], edges: AppEdge[]) => void;
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) }),
  addNode: (node) => set({ nodes: [...get().nodes, node] }),
  updateNodeData: (id, patch) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as AppNode) : n,
      ),
    }),
  setGraph: (nodes, edges) => set({ nodes, edges }),
}));
