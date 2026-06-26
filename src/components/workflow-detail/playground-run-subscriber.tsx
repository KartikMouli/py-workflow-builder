"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useEffect } from "react";

const TERMINAL = new Set(["COMPLETED", "FAILED", "CANCELED", "CRASHED", "TIMED_OUT", "INTERRUPTED"]);

export type PlaygroundNodeRun = {
  nodeId: string;
  nodeType: string;
  status: string;
  error: string | null;
  output: Record<string, unknown> | null;
};

export function PlaygroundRunSubscriber({
  triggerRunId,
  token,
  dbRunId,
  onDone,
}: {
  triggerRunId: string;
  token: string;
  dbRunId: string;
  onDone: (nodeRuns: PlaygroundNodeRun[], failed: boolean) => void;
}) {
  const { run } = useRealtimeRun(triggerRunId, { accessToken: token });

  useEffect(() => {
    if (!run || !TERMINAL.has(run.status)) return;
    void fetch(`/api/runs/${dbRunId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const nodeRuns = (data?.run?.nodeRuns as PlaygroundNodeRun[] | undefined) ?? [];
        onDone(nodeRuns, nodeRuns.some((nr) => nr.status === "FAILED"));
      })
      .catch(() => onDone([], true));
  }, [run, dbRunId, onDone]);

  return null;
}
