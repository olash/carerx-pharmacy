"use client";

import { useRef, useState } from "react";
import { UploadCloud02, File06, Trash01, CheckCircle } from "@untitledui/icons";
import { cn } from "@/lib/utils";

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Untitled UI file-upload dropzone (single file). */
export function FileDropzone({
  file,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/heic,application/pdf",
  maxBytes = 10 * 1024 * 1024,
  hint = "JPG, PNG, HEIC or PDF (max. 10MB)",
  invalid,
  id = "file",
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  accept?: string;
  maxBytes?: number;
  hint?: string;
  invalid?: boolean;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (f: File | undefined | null) => {
    setError(null);
    if (!f) return;
    const types = accept.split(",");
    if (!types.includes(f.type) && !(f.type === "" && /\.heic$/i.test(f.name))) {
      setError("That file type isn’t supported.");
      return;
    }
    if (f.size > maxBytes) {
      setError(`File is too large. Max ${formatBytes(maxBytes)}.`);
      return;
    }
    onChange(f);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-5 text-center ring-1 ring-inset transition",
          drag ? "bg-brand-25 ring-2 ring-brand-600" : invalid || error ? "ring-error-300" : "ring-gray-200",
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-white text-gray-600 shadow-xs ring-1 ring-inset ring-gray-200">
          <UploadCloud02 className="size-5" />
        </span>
        <div className="text-sm text-gray-600">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-brand-700 outline-none hover:text-brand-800 focus-visible:underline"
          >
            Click to upload
          </button>{" "}
          or drag and drop
          <p className="mt-1 text-xs">{hint}</p>
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-sm text-error-600">{error}</p>}
      {file && (
        <div className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-inset ring-brand-600">
          <File06 className="size-8 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700">{file.name}</p>
            <p className="flex items-center gap-1 text-sm text-gray-600">
              {formatBytes(file.size)} <CheckCircle className="size-4 text-brand-600" />
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="-m-1 rounded-md p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-500"
            aria-label="Remove file"
          >
            <Trash01 className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function fileExtension(f: File) {
  const fromName = f.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return f.type.split("/")[1] ?? "bin";
}
