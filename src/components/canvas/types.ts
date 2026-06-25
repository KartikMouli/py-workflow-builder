import type { Edge, Node } from "@xyflow/react";

export type DataType = "text" | "number" | "image" | "video" | "audio" | "file" | "any";

export const NODE_KINDS = ["request-inputs", "crop-image", "gemini", "response"] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "image"
  | "audio"
  | "video"
  | "media"
  | "file";

export type InputField = {
  id: string;
  name: string;
  type: FieldType;
  value?: string;
};

export type RequestInputsData = { fields: InputField[] };

export type CropImageData = {
  inputImageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  outputUrl?: string;
};

export type GeminiSettings = { temperature: number; maxOutputTokens: number };
export type GeminiData = {
  model: string;
  prompt?: string;
  systemPrompt?: string;
  imageUrl?: string;
  settings: GeminiSettings;
  response?: string;
};

export type ResponseData = Record<string, never>;

export type RequestInputsNode = Node<RequestInputsData, "request-inputs">;
export type CropImageNode = Node<CropImageData, "crop-image">;
export type GeminiNode = Node<GeminiData, "gemini">;
export type ResponseNode = Node<ResponseData, "response">;
export type AppNode = RequestInputsNode | CropImageNode | GeminiNode | ResponseNode;
export type AppEdge = Edge;

// Handle/edge color by data type (sampled palette: text=orange, image=blue).
export const TYPE_COLOR: Record<DataType, string> = {
  text: "#f59e0b",
  number: "#ec4899",
  image: "#3b82f6",
  video: "#22c55e",
  audio: "#06b6d4",
  file: "#9ca3af",
  any: "#6058e8",
};

export function fieldDataType(t: FieldType): DataType {
  switch (t) {
    case "image":
    case "media":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "file":
      return "file";
    case "number":
      return "number";
    default:
      return "text";
  }
}

function genId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createPrePlacedNodes(): AppNode[] {
  return [
    {
      id: "request-inputs",
      type: "request-inputs",
      position: { x: 80, y: 160 },
      deletable: false,
      data: { fields: [{ id: genId("field"), name: "text_field", type: "text" }] },
    },
    {
      id: "response",
      type: "response",
      position: { x: 920, y: 220 },
      deletable: false,
      data: {},
    },
  ];
}

export function createCropImageNode(position: { x: number; y: number }): CropImageNode {
  return {
    id: genId("crop-image"),
    type: "crop-image",
    position,
    data: { x: 0, y: 0, width: 100, height: 100 },
  };
}

export function createGeminiNode(position: { x: number; y: number }): GeminiNode {
  return {
    id: genId("gemini"),
    type: "gemini",
    position,
    data: { model: "gemini-3-flash-preview", settings: { temperature: 1, maxOutputTokens: 2048 } },
  };
}
