"use client";

import { Plus, Search, Upload, Workflow } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useRef, useState } from "react";
import { WorkflowCard } from "./workflow-card";

export type WorkflowListItem = {
  id: string;
  name: string;
  thumbnail?: string | null;
  updatedAt: string;
};

export function DashboardView({ workflows }: { workflows: WorkflowListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [renameTarget, setRenameTarget] = useState<WorkflowListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WorkflowListItem | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function createWorkflow(name = "Untitled workflow") {
    setBusy(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Create failed");
      const { workflow } = (await res.json()) as { workflow: { id: string } };
      router.push(`/workflow/${workflow.id}`);
    } catch {
      setBusy(false);
      alert("Couldn't create the workflow. Please try again.");
    }
  }

  async function createTrialWorkflow() {
    setBusy(true);
    try {
      const res = await fetch("/api/workflows/seed", { method: "POST" });
      if (!res.ok) throw new Error("Seed failed");
      const { workflow } = (await res.json()) as { workflow: { id: string } };
      router.push(`/workflow/${workflow.id}`);
    } catch {
      setBusy(false);
      alert("Couldn't create the Trial Task Workflow. Please try again.");
    }
  }

  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const json = JSON.parse(await file.text());
      const res = await fetch("/api/workflows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) throw new Error("Import failed");
      router.refresh();
    } catch {
      alert("Import failed — that file isn't a valid workflow JSON.");
    } finally {
      setBusy(false);
    }
  }

  async function duplicateWorkflow(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/workflows/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Duplicate failed");
      router.refresh();
    } catch {
      alert("Couldn't duplicate the workflow. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function exportWorkflow(id: string) {
    const a = document.createElement("a");
    a.href = `/api/workflows/${id}/export`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function setThumbnail(id: string, thumbnail: string) {
    setBusy(true);
    try {
      await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnail }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function confirmRename() {
    const name = renameValue.trim();
    if (!renameTarget || !name) return;
    setBusy(true);
    try {
      await fetch(`/api/workflows/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setRenameTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/workflows/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Flow</h1>
            <p className="mt-1 text-sm text-gray-500">Build workflows or run models directly</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="flex h-9 items-center gap-2 rounded-lg bg-gray-100 px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              type="button"
              onClick={() => createWorkflow()}
              disabled={busy}
              aria-label="New workflow"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={onImportFile}
            />
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900">System Workflows</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Prebuilt workflow templates — click to open and start using.
          </p>
          <button
            type="button"
            onClick={createTrialWorkflow}
            disabled={busy}
            className="mt-3 flex w-56 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left hover:border-brand/40 hover:shadow-sm disabled:opacity-50"
          >
            <div className="flex h-28 items-center justify-center bg-gray-100">
              <Workflow className="h-8 w-8 text-gray-400" />
            </div>
            <span className="px-3 py-2 text-sm font-medium text-gray-800">Trial Task Workflow</span>
          </button>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Your Workflows</h2>
              <p className="mt-0.5 text-sm text-gray-500">Open one to edit, run, and review history.</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workflows..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand/50"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
              <Workflow className="h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-700">
                {workflows.length === 0 ? "No workflows yet" : "No matches"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {workflows.length === 0
                  ? "Create your first workflow to get started."
                  : "Try a different search."}
              </p>
              {workflows.length === 0 && (
                <button
                  type="button"
                  onClick={() => createWorkflow()}
                  disabled={busy}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  New workflow
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((w) => (
                <WorkflowCard
                  key={w.id}
                  workflow={w}
                  onOpen={() => router.push(`/workflow/${w.id}`)}
                  onRename={() => {
                    setRenameTarget(w);
                    setRenameValue(w.name);
                  }}
                  onDuplicate={() => duplicateWorkflow(w.id)}
                  onExport={() => exportWorkflow(w.id)}
                  onDelete={() => setDeleteTarget(w)}
                  onThumbnail={(dataUrl) => setThumbnail(w.id, dataUrl)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {renameTarget && (
        <Dialog onClose={() => setRenameTarget(null)} title="Rename workflow">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmRename()}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand/50"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRename}
              disabled={busy || !renameValue.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </Dialog>
      )}

      {deleteTarget && (
        <Dialog onClose={() => setDeleteTarget(null)} title="Delete workflow">
          <p className="text-sm text-gray-600">
            Delete <span className="font-medium text-gray-900">{deleteTarget.name}</span>? This also
            removes its run history and can&apos;t be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
