"use client";

import { Download, Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Clickable image thumbnail that opens a full-size in-app preview. The overlay is portalled to
// <body> so it escapes React Flow's transformed canvas and covers the whole viewport.
export function ImagePreview({
  src,
  thumbClassName = "h-20 w-full",
  downloadName = "image.png",
}: {
  src: string;
  thumbClassName?: string;
  downloadName?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Preview image"
        className={`nodrag group/preview relative overflow-hidden rounded bg-gray-50 bg-contain bg-center bg-no-repeat ${thumbClassName}`}
        style={{ backgroundImage: `url("${src}")` }}
      >
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover/preview:bg-black/30 group-hover/preview:opacity-100">
          <Maximize2 className="h-4 w-4 text-white drop-shadow" />
        </span>
      </button>
      {open && <Lightbox src={src} downloadName={downloadName} onClose={() => setOpen(false)} />}
    </>
  );
}

function Lightbox({
  src,
  downloadName,
  onClose,
}: {
  src: string;
  downloadName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div className="relative max-h-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Output preview"
          className="max-h-[85vh] w-auto max-w-[90vw] rounded-lg object-contain shadow-2xl"
        />
        <div className="absolute right-2 top-2 flex gap-2">
          <a
            href={src}
            download={downloadName}
            onClick={(e) => e.stopPropagation()}
            aria-label="Download image"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow hover:bg-white"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
