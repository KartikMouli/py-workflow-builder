import { type Connection, type Edge, getOutgoers } from "@xyflow/react";
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
