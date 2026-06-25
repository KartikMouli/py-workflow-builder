import { Handle, Position } from "@xyflow/react";
import { Info, MoreHorizontal, Play, RotateCcw } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { type DataType, TYPE_COLOR } from "../types";

export function InfoHint({ text }: { text: string }) {
  return (
    <span className="nodrag group/info relative inline-flex items-center">
      <Info className="h-3.5 w-3.5 cursor-help text-gray-300 hover:text-gray-500" />
      <span className="pointer-events-none absolute left-1/2 top-5 z-50 hidden w-48 -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg group-hover/info:block">
        {text}
      </span>
    </span>
  );
}

export function NodeFrame({
  title,
  info,
  selected,
  running,
  showRun,
  headerAction,
  children,
  width = 264,
}: {
  title: string;
  info?: string;
  selected?: boolean;
  running?: boolean;
  showRun?: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
  width?: number;
}) {
  const ring = running
    ? "border-brand shadow-[0_0_0_3px_rgba(96,88,232,0.35)] animate-pulse"
    : selected
      ? "border-brand ring-2 ring-brand/30"
      : "border-gray-200";

  return (
    <div className={`rounded-xl border bg-white shadow-sm ${ring}`} style={{ width }}>
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-2.5">
        <span className="truncate text-sm font-semibold text-gray-800">{title}</span>
        {info && <InfoHint text={info} />}
        <div className="flex-1" />
        {headerAction}
        {showRun && (
          <>
            <button
              type="button"
              aria-label="Reset node"
              className="nodrag text-gray-400 hover:text-gray-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="nodrag flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              <Play className="h-3 w-3" />
              Run
            </button>
          </>
        )}
        <button type="button" className="nodrag text-gray-400 hover:text-gray-700">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function RowHandle({
  side,
  id,
  dataType,
  kind,
}: {
  side: "left" | "right";
  id: string;
  dataType: DataType;
  kind: "source" | "target";
}) {
  const style: CSSProperties = {
    top: "50%",
    transform: "translateY(-50%)",
    width: 14,
    height: 14,
    borderRadius: 9999,
    background: TYPE_COLOR[dataType],
    border: "2px solid #fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
  };
  if (side === "left") style.left = -13;
  else style.right = -13;

  return (
    <Handle
      type={kind}
      position={side === "left" ? Position.Left : Position.Right}
      id={id}
      style={style}
    />
  );
}
