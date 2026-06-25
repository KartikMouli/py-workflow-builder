"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useEffect } from "react";
import { type NodeRunState, useCanvasStore } from "./store";

const TERMINAL = new Set(["COMPLETED", "FAILED", "CANCELED", "CRASHED", "TIMED_OUT", "INTERRUPTED"]);

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
        if (!data?.run?.nodeRuns) return;
        const outputs: Record<string, Record<string, unknown>> = {};
        for (const nr of data.run.nodeRuns) {
          if (nr.output) outputs[nr.nodeId] = nr.output;
        }
        setOutputs(outputs);
      })
      .catch(() => {});
  }, [run, dbRunId, setOutputs]);

  return null;
}
