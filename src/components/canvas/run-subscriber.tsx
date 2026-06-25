"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useEffect } from "react";
import { type NodeRunState, useCanvasStore } from "./store";

const TERMINAL = new Set(["COMPLETED", "FAILED", "CANCELED", "CRASHED", "TIMED_OUT", "INTERRUPTED"]);

const NODE_LABEL: Record<string, string> = {
  "request-inputs": "Request Inputs",
  "crop-image": "Crop Image",
  gemini: "Gemini 3 Flash",
  response: "Response",
};

type NodeRunRow = {
  nodeId: string;
  nodeType: string;
  status: string;
  error?: string | null;
  output?: Record<string, unknown> | null;
};

export function RunSubscriber({
  triggerRunId,
  token,
  dbRunId,
}: {
  triggerRunId: string;
  token: string;
  dbRunId: string;
}) {
  const setRunStates = useCanvasStore((s) => s.setRunStates);
  const setOutputs = useCanvasStore((s) => s.setOutputs);
  const showToast = useCanvasStore((s) => s.showToast);
  const clearLiveRun = useCanvasStore((s) => s.clearLiveRun);
  const { run } = useRealtimeRun(triggerRunId, { accessToken: token });

  useEffect(() => {
    const states = (run?.metadata as { nodes?: Record<string, NodeRunState> } | undefined)?.nodes;
    if (states) setRunStates(states);
  }, [run?.metadata, setRunStates]);

  useEffect(() => {
    if (!run || !TERMINAL.has(run.status)) return;
    void fetch(`/api/runs/${dbRunId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const nodeRuns = (data?.run?.nodeRuns as NodeRunRow[] | undefined) ?? [];
        if (nodeRuns.length) {
          const outputs: Record<string, Record<string, unknown>> = {};
          for (const nr of nodeRuns) {
            if (nr.output) outputs[nr.nodeId] = nr.output;
          }
          setOutputs(outputs);
        }
        const failed = nodeRuns.find((nr) => nr.status === "FAILED");
        if (failed) {
          const label = NODE_LABEL[failed.nodeType] ?? "Node";
          showToast(`${label} failed: ${failed.error ?? "Unknown error"}`);
        } else if (run.status === "FAILED" || run.status === "CRASHED" || run.status === "TIMED_OUT") {
          showToast("Run failed to complete.");
        }
      })
      .catch(() => {})
      .finally(() => clearLiveRun());
  }, [run, dbRunId, setOutputs, showToast, clearLiveRun]);

  return null;
}
