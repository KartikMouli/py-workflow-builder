"use client";

import {
  Copy,
  Download,
  ImagePlus,
  MoreVertical,
  Pencil,
  SquareArrowOutUpRight,
  Trash2,
  Workflow,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { WorkflowListItem } from "./dashboard-view";

function formatEdited(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Edited just now";
  if (mins < 60) return `Edited ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Edited ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Edited ${days}d ago`;
  return `Edited ${Math.floor(days / 7)}w ago`;
}

async function fileToThumbnail(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const maxW = 480;
  const scale = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function WorkflowCard({
  workflow,
  onOpen,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
  onThumbnail,
}: {
  workflow: WorkflowListItem;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
  onThumbnail: (dataUrl: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function onPickThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      onThumbnail(await fileToThumbnail(file));
    } catch {
      // ignore unreadable images
    }
  }

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-100">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${workflow.name}`}
          className="absolute inset-0 h-full w-full"
        >
          {workflow.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={workflow.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Workflow className="h-8 w-8 text-gray-400" />
            </span>
          )}
        </button>
        {workflow.running && (
          <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-blue-600 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            Running
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label="Edit thumbnail"
        className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-600 opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-white hover:text-gray-900 group-hover:opacity-100"
      >
        <ImagePlus className="h-4 w-4" />
      </button>

      <div ref={menuRef} className="absolute right-3 top-3">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Workflow actions"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-600 opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-white hover:text-gray-900 group-hover:opacity-100 data-[open=true]:opacity-100"
          data-open={menuOpen}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
            <MenuItem icon={<SquareArrowOutUpRight className="h-4 w-4" />} onClick={() => run(setMenuOpen, onOpen)}>
              Open
            </MenuItem>
            <MenuItem icon={<Pencil className="h-4 w-4" />} onClick={() => run(setMenuOpen, onRename)}>
              Rename
            </MenuItem>
            <MenuItem icon={<Copy className="h-4 w-4" />} onClick={() => run(setMenuOpen, onDuplicate)}>
              Duplicate
            </MenuItem>
            <MenuItem icon={<Download className="h-4 w-4" />} onClick={() => run(setMenuOpen, onExport)}>
              Export JSON
            </MenuItem>
            <div className="my-1 h-px bg-gray-100" />
            <MenuItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => run(setMenuOpen, onDelete)}>
              Delete
            </MenuItem>
          </div>
        )}
      </div>

      <button type="button" onClick={onOpen} className="px-0.5 pt-3 text-left">
        <p className="truncate text-sm font-medium text-gray-900">{workflow.name}</p>
        <p className="mt-1 text-xs text-gray-400" suppressHydrationWarning>
          {formatEdited(workflow.updatedAt)}
        </p>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPickThumbnail}
      />
    </div>
  );
}

function run(setMenuOpen: (v: boolean) => void, fn: () => void) {
  setMenuOpen(false);
  fn();
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
