import { type Connection, type Edge, getOutgoers } from "@xyflow/react";
import { z } from "zod";
import { type AppEdge, type AppNode, type DataType, TYPE_COLOR, fieldDataType } from "./types";

export function handleDataType(node: AppNode, handleId: string | null | undefined): DataType {
  if (!handleId) return "any";
  switch (node.type) {
    case "request-inputs": {
      const field = node.data.fields.find((f) => f.id === handleId);
      return field ? fieldDataType(field.type) : "any";
    }
    case "crop-image":
      return handleId === "input-image" || handleId === "output-image" ? "image" : "number";
    case "gemini":
      switch (handleId) {
        case "image":
          return "image";
        case "video":
          return "video";
        case "audio":
          return "audio";
        case "file":
          return "file";
        default:
          return "text";
      }
    case "response":
    case "sticky-note":
      return "any";
  }
}

function typesCompatible(source: DataType, target: DataType): boolean {
  return source === target || source === "any" || target === "any";
}

function wouldCreateCycle(source: string, target: string, nodes: AppNode[], edges: AppEdge[]): boolean {
  const targetNode = nodes.find((n) => n.id === target);
  if (!targetNode) return false;
  const visited = new Set<string>();
  const stack: AppNode[] = [targetNode];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    if (current.id === source) return true;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    stack.push(...(getOutgoers(current, nodes, edges) as AppNode[]));
  }
  return false;
}

export function isValidConnection(
  connection: Connection | Edge,
  nodes: AppNode[],
  edges: AppEdge[],
): boolean {
  const { source, target, sourceHandle, targetHandle } = connection;
  if (!source || !target || source === target) return false;
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);
  if (!sourceNode || !targetNode) return false;
  if (!typesCompatible(handleDataType(sourceNode, sourceHandle), handleDataType(targetNode, targetHandle)))
    return false;
  return !wouldCreateCycle(source, target, nodes, edges);
}

// The Response node's `result` is a collector — it accepts many incoming edges.
export function allowsMultipleInputs(node: AppNode | undefined): boolean {
  return node?.type === "response";
}

export function withEdgeStyle(edge: AppEdge, nodes: AppNode[]): AppEdge {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const type = sourceNode ? handleDataType(sourceNode, edge.sourceHandle) : "any";
  return {
    ...edge,
    animated: false,
    style: { ...edge.style, stroke: TYPE_COLOR[type], strokeWidth: 2.5 },
  };
}

export function serializeGraph(nodes: AppNode[], edges: AppEdge[]) {
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

// Required inputs per node type — checked before a run.
const REQUIRED_INPUTS: Record<string, { handle: string; label: string; dataKey: string }[]> = {
  gemini: [{ handle: "prompt", label: "Prompt", dataKey: "prompt" }],
  "crop-image": [{ handle: "input-image", label: "Input Image", dataKey: "inputImageUrl" }],
};

const requiredString = z.string().min(1);

// Returns the first validation error message, or null if all required inputs are satisfied.
// FULL run: a required input is satisfied by an incoming edge or a manual value.
// SINGLE run: upstream nodes don't run, so only a manual value satisfies it.
export function validateRunInputs(
  nodes: AppNode[],
  edges: AppEdge[],
  scope: "FULL" | "SINGLE",
): string | null {
  for (const node of nodes) {
    for (const req of REQUIRED_INPUTS[node.type ?? ""] ?? []) {
      const connected = edges.some((e) => e.target === node.id && e.targetHandle === req.handle);
      if (scope === "FULL" && connected) continue;
      const value = (node.data as Record<string, unknown>)[req.dataKey];
      const parsed = requiredString.safeParse(typeof value === "string" ? value.trim() : value);
      if (!parsed.success) return `"${req.label}" is required — enter a value or connect an input.`;
    }
  }
  return null;
}
