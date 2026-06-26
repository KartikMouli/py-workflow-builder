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

// Handles that collect many incoming edges: the Response node's `result`, and the
// Gemini node's Image (Vision) handle (multimodal accepts multiple images).
export function allowsMultipleInputs(
  node: AppNode | undefined,
  handleId?: string | null,
): boolean {
  if (node?.type === "response") return true;
  if (node?.type === "gemini" && handleId === "image") return true;
  return false;
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
// A required input is satisfied when a node that WILL run produces it, otherwise a manual value
// is needed. Which nodes run depends on scope:
//   FULL    — every node runs; a connected input is traced one hop (an empty Request-Inputs
//             field is still caught), a producing source (Gemini/Crop) is trusted.
//   PARTIAL — only the selected nodes run; an input wired to a selected node is trusted, one
//             wired to an unselected node falls back to the manual value.
//   SINGLE  — upstream nodes don't run, so only a manual value satisfies it.
export function validateRunInputs(
  nodes: AppNode[],
  edges: AppEdge[],
  scope: "FULL" | "PARTIAL" | "SINGLE",
  targets?: string[],
): string | null {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const targetSet = targets && targets.length ? new Set(targets) : null;
  const willRun = (id: string) => (scope === "FULL" ? true : !!targetSet?.has(id));
  const hasValue = (v: unknown) =>
    requiredString.safeParse(typeof v === "string" ? v.trim() : v).success;

  for (const node of nodes) {
    if (!willRun(node.id)) continue;
    for (const req of REQUIRED_INPUTS[node.type ?? ""] ?? []) {
      const edge = edges.find((e) => e.target === node.id && e.targetHandle === req.handle);

      if (scope !== "SINGLE" && edge && willRun(edge.source)) {
        const source = nodeById.get(edge.source);
        if (source?.type === "request-inputs") {
          const field = source.data.fields.find((f) => f.id === edge.sourceHandle);
          if (hasValue(field?.value)) continue;
          return `"${req.label}" is connected to an empty input — fill it in or enter a value.`;
        }
        continue;
      }

      const value = (node.data as Record<string, unknown>)[req.dataKey];
      if (!hasValue(value)) return `"${req.label}" is required — enter a value or connect an input.`;
    }
  }
  return null;
}
