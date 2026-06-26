"use client";

import { Code2 } from "lucide-react";

export function ApiTab() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-6">
      <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <Code2 className="h-6 w-6 text-gray-400" />
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600">API access</p>
        <p className="mt-1 text-xs text-gray-400">Nothing here yet.</p>
      </div>
    </div>
  );
}
