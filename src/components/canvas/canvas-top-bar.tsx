"use client";

import { ArrowLeft, History, Play } from "lucide-react";
import Link from "next/link";

export function CanvasTopBar({ name }: { name: string }) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-semibold text-gray-800">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
        >
          <History className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
