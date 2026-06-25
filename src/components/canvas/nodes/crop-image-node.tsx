"use client";

import type { NodeProps } from "@xyflow/react";
import { useCanvasStore, useConnectedTargets } from "../store";
import type { CropImageNode } from "../types";
import { ImageUploadButton } from "./image-upload-button";
import { NodeFrame, RowHandle } from "./node-frame";

const PARAMS: { key: "x" | "y" | "width" | "height"; label: string }[] = [
  { key: "x", label: "X Position (%)" },
  { key: "y", label: "Y Position (%)" },
  { key: "width", label: "Width (%)" },
  { key: "height", label: "Height (%)" },
];

export function CropImageNodeView({ id, data, selected }: NodeProps<CropImageNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const connected = useConnectedTargets(id);
  const runState = useCanvasStore((s) => s.runStates[id]);
  const outputImage = useCanvasStore((s) => s.outputs[id]?.["output-image"]) as string | undefined;

  return (
    <NodeFrame
      title="Crop Image"
      info="Crop an image to a region set by X/Y position and width/height percentages."
      menuNodeId={id}
      selected={selected}
      showRun
      running={runState?.status === "RUNNING"}
    >
      <div className="space-y-3">
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Input Image <span className="text-red-500">*</span>
          </label>
          <ImageUploadButton
            value={data.inputImageUrl}
            disabled={connected.has("input-image")}
            onChange={(url) => updateNodeData(id, { inputImageUrl: url })}
          />
          <RowHandle side="left" kind="target" id="input-image" dataType="image" />
        </div>

        {PARAMS.map((p) => {
          const isConnected = connected.has(p.key);
          return (
            <div key={p.key} className={`relative ${isConnected ? "opacity-50" : ""}`}>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">{p.label}</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={isConnected}
                  value={data[p.key]}
                  onChange={(e) => updateNodeData(id, { [p.key]: Number(e.target.value) })}
                  className="nodrag w-14 rounded border border-gray-200 px-1.5 py-0.5 text-right text-xs outline-none"
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                disabled={isConnected}
                value={data[p.key]}
                onChange={(e) => updateNodeData(id, { [p.key]: Number(e.target.value) })}
                className="nodrag w-full accent-brand"
              />
              <RowHandle side="left" kind="target" id={p.key} dataType="number" />
            </div>
          );
        })}

        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-gray-600">Output Image</label>
          {outputImage ? (
            <div className="overflow-hidden rounded-md border border-gray-200">
              <div
                className="h-24 w-full bg-gray-50 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${outputImage}")` }}
              />
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 py-3 text-center text-xs text-gray-400">
              {runState?.error ?? (runState?.status === "RUNNING" ? "Cropping…" : "No output yet")}
            </div>
          )}
          <RowHandle side="right" kind="source" id="output-image" dataType="image" />
        </div>
      </div>
    </NodeFrame>
  );
}
