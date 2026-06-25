"use client";

import type { NodeProps } from "@xyflow/react";
import { LogIn } from "lucide-react";
import type { ResponseNode } from "../types";
import { NodeFrame, RowHandle } from "./node-frame";

export function ResponseNodeView({ selected }: NodeProps<ResponseNode>) {
  return (
    <NodeFrame title="Response" selected={selected} icon={<LogIn className="h-3.5 w-3.5 text-brand" />}>
      <div className="relative">
        <span className="text-xs font-medium text-gray-600">result</span>
        <RowHandle side="left" kind="target" id="result" dataType="any" />
        <div className="mt-2 rounded-md bg-gray-50 px-2 py-3 text-center text-xs text-gray-400">
          No output yet
        </div>
      </div>
    </NodeFrame>
  );
}
