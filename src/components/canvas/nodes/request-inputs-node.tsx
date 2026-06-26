"use client";

import type { NodeProps } from "@xyflow/react";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCanvasStore } from "../store";
import { type FieldType, type InputField, type RequestInputsNode, fieldDataType } from "../types";
import { ImageUploadButton } from "./image-upload-button";
import { NodeFrame, type RunPhase, RowHandle } from "./node-frame";

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "number", label: "Number" },
  { type: "boolean", label: "Boolean" },
  { type: "image", label: "Image" },
  { type: "audio", label: "Audio" },
  { type: "video", label: "Video" },
  { type: "media", label: "Media" },
  { type: "file", label: "File" },
];

export function RequestInputsNodeView({ id, data, selected }: NodeProps<RequestInputsNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const liveRun = useCanvasStore((s) => s.liveRun);
  const runState = useCanvasStore((s) => s.runStates[id]);
  const [menuOpen, setMenuOpen] = useState(false);
  const fields = data.fields;
  const setFields = (next: InputField[]) => updateNodeData(id, { fields: next });

  function addField(type: FieldType) {
    setMenuOpen(false);
    const base = type === "text" ? "text_field" : `${type}_field`;
    const count = fields.filter((f) => f.type === type).length;
    const name = count === 0 ? base : `${base}_${count + 1}`;
    setFields([...fields, { id: `field-${crypto.randomUUID().slice(0, 8)}`, name, type }]);
  }

  return (
    <NodeFrame
      title="Request-Inputs"
      info="Define the inputs your workflow accepts. Each field becomes an output you can connect."
      selected={selected}
      runStatus={liveRun ? (runState?.status as RunPhase | undefined) : undefined}
      headerAction={
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="nodrag flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {FIELD_TYPES.map((ft) => (
                <button
                  key={ft.type}
                  type="button"
                  onClick={() => addField(ft.type)}
                  className="nodrag block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  {ft.label}
                </button>
              ))}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.id} className="relative rounded-lg border border-gray-100 bg-gray-50 p-2">
            <div className="mb-1 flex items-center gap-1">
              <GripVertical className="h-3.5 w-3.5 cursor-grab text-gray-300" />
              <input
                value={f.name}
                onChange={(e) =>
                  setFields(fields.map((x) => (x.id === f.id ? { ...x, name: e.target.value } : x)))
                }
                className="nodrag min-w-0 flex-1 bg-transparent text-xs font-medium text-gray-700 outline-none"
              />
              <button type="button" className="nodrag text-gray-300 hover:text-gray-600">
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFields(fields.filter((x) => x.id !== f.id))}
                className="nodrag text-gray-300 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {f.type === "image" || f.type === "media" ? (
              <ImageUploadButton
                value={f.value}
                onChange={(url) =>
                  setFields(fields.map((x) => (x.id === f.id ? { ...x, value: url } : x)))
                }
              />
            ) : (
              <textarea
                value={f.value ?? ""}
                onChange={(e) =>
                  setFields(fields.map((x) => (x.id === f.id ? { ...x, value: e.target.value } : x)))
                }
                placeholder="Enter text..."
                rows={3}
                className="nodrag w-full resize-y rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand/40"
              />
            )}
            <RowHandle side="right" kind="source" id={f.id} dataType={fieldDataType(f.type)} />
          </div>
        ))}
      </div>
    </NodeFrame>
  );
}
