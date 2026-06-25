"use client";

import { ArrowLeft, History, Play } from "lucide-react";
import Link from "next/link";

export function CanvasTopBar({ name }: { name: string }) {
  return (
    <>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-2 pr-4 shadow-sm">
        <Link
          href="/dashboard"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-medium text-gray-800">{name}</span>
      </div>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white shadow-sm hover:bg-brand-hover"
        >
          <Play className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50"
        >
          <History className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
