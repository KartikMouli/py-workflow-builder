"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AppEdge, AppNode } from "@/components/canvas/types";
import { ApiTab } from "./api-tab";
import { PlaygroundTab } from "./playground-tab";
import { WorkflowTab } from "./workflow-tab";

type Graph = { nodes: AppNode[]; edges: AppEdge[] };
type Tab = "playground" | "api" | "workflow";

const TABS: { id: Tab; label: string }[] = [
  { id: "playground", label: "Playground" },
  { id: "api", label: "API" },
  { id: "workflow", label: "Workflow" },
];

export function WorkflowDetail({
  workflowId,
  name,
  graph,
}: {
  workflowId: string;
  name: string;
  graph: Graph;
}) {
  const [tab, setTab] = useState<Tab>("playground");

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      <header className="flex items-center gap-3 pb-3 pl-15 pr-15 pt-8">
        <Link
          href="/dashboard"
          aria-label="Back to flows"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">{name}</h1>
      </header>

      <nav className="flex items-center gap-6 border-b border-gray-200 pl-15 pr-15 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 py-2.5 text-sm transition-colors ${
              tab === t.id
                ? "border-gray-900 font-medium text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "playground" && <PlaygroundTab workflowId={workflowId} graph={graph} />}
        {tab === "api" && <ApiTab />}
        {tab === "workflow" && <WorkflowTab workflowId={workflowId} graph={graph} />}
      </div>
    </div>
  );
}
