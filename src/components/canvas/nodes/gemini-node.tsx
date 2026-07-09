"use client";

import type { NodeProps } from "@xyflow/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useCanvasStore, useConnectedTargets } from "../store";
import type { DataType, GeminiNode } from "../types";
import { ImageUploadButton } from "./image-upload-button";
import { NodeFrame, type RunPhase, RowHandle } from "./node-frame";

const UPLOAD_INPUTS: { id: string; label: string; type: DataType }[] = [
  { id: "image", label: "Image (Vision)", type: "image" },
  { id: "video", label: "Video", type: "video" },
  { id: "audio", label: "Audio", type: "audio" },
  { id: "file", label: "File", type: "file" },
];

// Gemini 2.5 Flash is GA (no high-demand 503s) and is the reliable fallback if a preview throttles.
const MODELS: { label: string; api: string }[] = [
  { label: "Gemini 3.1 Pro", api: "gemini-3.1-pro-preview" },
  { label: "Gemini 3 Flash", api: "gemini-3-flash-preview" },
  { label: "Gemini 2.5 Flash", api: "gemini-2.5-flash" },
];

function ModelDropdown({ id, current }: { id: string; current: string }) {
  const [open, setOpen] = useState(false);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  return (
    <div className="nodrag relative">
      <button
        type="button"
        aria-label="Select model"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-gray-200 px-1.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
      >
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {MODELS.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => {
                  updateNodeData(id, { model: m.api, modelLabel: m.label });
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs ${
                  m.label === current
                    ? "bg-gray-50 font-medium text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function GeminiNodeView({ id, data, selected }: NodeProps<GeminiNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const connected = useConnectedTargets(id);
  const liveRun = useCanvasStore((s) => s.liveRun);
  const runState = useCanvasStore((s) => s.runStates[id]);
  const outputResponse = useCanvasStore((s) => s.outputs[id]?.response) as string | undefined;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const responseText = runState?.text ?? outputResponse;
  const modelLabel = data.modelLabel ?? "Gemini 3.1 Pro";

  return (
    <NodeFrame
      title={modelLabel}
      info="Generate text with Google's Gemini. Connect a prompt and optional image, video, or audio."
      menuNodeId={id}
      selected={selected}
      showRun
      width={300}
      cost={0.0025}
      headerAction={<ModelDropdown id={id} current={modelLabel} />}
      runStatus={liveRun ? (runState?.status as RunPhase | undefined) : undefined}
    >
      <div className="space-y-3">
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.prompt ?? ""}
            disabled={connected.has("prompt")}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            placeholder={connected.has("prompt") ? "Connected" : "Enter your prompt..."}
            rows={3}
            className="nodrag w-full resize-y rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand/40 disabled:opacity-50"
          />
          <RowHandle side="left" kind="target" id="prompt" dataType="text" />
        </div>

        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-gray-600">System Prompt</label>
          <textarea
            value={data.systemPrompt ?? ""}
            disabled={connected.has("system-prompt")}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
            placeholder={connected.has("system-prompt") ? "Connected" : "Optional system prompt..."}
            rows={3}
            className="nodrag w-full resize-y rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand/40 disabled:opacity-50"
          />
          <RowHandle side="left" kind="target" id="system-prompt" dataType="text" />
        </div>

        {UPLOAD_INPUTS.map((inp) => (
          <div key={inp.id} className="relative">
            <label className="mb-1 block text-xs font-medium text-gray-600">{inp.label}</label>
            {inp.id === "image" ? (
              <ImageUploadButton
                value={data.imageUrl}
                disabled={connected.has(inp.id)}
                label={`Upload ${inp.label.toLowerCase()}`}
                onChange={(url) => updateNodeData(id, { imageUrl: url })}
              />
            ) : (
              <button
                type="button"
                disabled={connected.has(inp.id)}
                className="nodrag w-full rounded-md border border-dashed border-gray-300 py-2 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {connected.has(inp.id) ? "Connected" : `Upload ${inp.label.toLowerCase()}`}
              </button>
            )}
            <RowHandle side="left" kind="target" id={inp.id} dataType={inp.type} />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className="nodrag flex w-full items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-600"
        >
          Settings
          <ChevronDown className={`h-3.5 w-3.5 transition ${settingsOpen ? "rotate-180" : ""}`} />
        </button>
        {settingsOpen && (
          <div className="space-y-2 rounded-md border border-gray-100 p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Temperature</span>
              <input
                type="number"
                step={0.1}
                min={0}
                max={2}
                value={data.settings.temperature}
                onChange={(e) =>
                  updateNodeData(id, {
                    settings: { ...data.settings, temperature: Number(e.target.value) },
                  })
                }
                className="nodrag w-16 rounded border border-gray-200 px-1.5 py-0.5 text-right outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Max tokens</span>
              <input
                type="number"
                min={1}
                value={data.settings.maxOutputTokens}
                onChange={(e) =>
                  updateNodeData(id, {
                    settings: { ...data.settings, maxOutputTokens: Number(e.target.value) },
                  })
                }
                className="nodrag w-16 rounded border border-gray-200 px-1.5 py-0.5 text-right outline-none"
              />
            </div>
          </div>
        )}

        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-gray-600">Response</label>
          {responseText ? (
            <div className="nodrag max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 px-2 py-2 text-xs text-gray-700">
              {responseText}
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 px-2 py-3 text-center text-xs text-gray-400">
              {runState?.error ?? (runState?.status === "RUNNING" ? "Generating…" : "No output yet")}
            </div>
          )}
          <RowHandle side="right" kind="source" id="response" dataType="text" />
        </div>
      </div>
    </NodeFrame>
  );
}
