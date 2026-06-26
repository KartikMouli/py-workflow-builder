"use client";

import { ImageUp, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { uploadImage } from "../upload";

export function ImageUploadButton({
  value,
  onChange,
  disabled,
  label = "Upload image",
}: {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try {
      onChange(await uploadImage(file));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (value && !busy) {
    return (
      <div className="relative overflow-hidden rounded-md border border-gray-200">
        <div
          className="h-24 w-full bg-gray-50 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${value}")` }}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="nodrag absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="nodrag flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-3 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
      >
        {busy ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
          </>
        ) : disabled ? (
          "Connected"
        ) : failed ? (
          "Upload failed — retry"
        ) : (
          <>
            <ImageUp className="h-3.5 w-3.5" /> {label}
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </>
  );
}
