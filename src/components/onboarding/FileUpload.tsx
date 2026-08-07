"use client";

import { useRef, useState } from "react";
import { Check, Loader2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPT = "application/pdf,image/jpeg,image/png";

type Status = "idle" | "uploading" | "uploaded" | "error";

export function FileUpload({
  label,
  required,
  value,
  fileName,
  onUploaded,
  onRemoved,
}: {
  label: string;
  required?: boolean;
  /** Storage path already uploaded, if any (controlled from the parent step). */
  value: string | null;
  /** Original filename to display once uploaded — kept in parent state alongside `value`. */
  fileName: string | null;
  onUploaded: (path: string, fileName: string) => void;
  onRemoved: () => void;
}) {
  const [status, setStatus] = useState<Status>(value ? "uploaded" : "idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > MAX_SIZE_BYTES) {
      setStatus("error");
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setStatus("error");
      setError("Unsupported file type. Please upload a PDF, JPG or PNG.");
      return;
    }

    setStatus("uploading");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/onboarding-uploads", { method: "POST", body });
      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success || typeof payload.path !== "string") {
        setStatus("error");
        setError(typeof payload?.error === "string" ? payload.error : "Upload failed. Please try again.");
        return;
      }

      setStatus("uploaded");
      onUploaded(payload.path, file.name);
    } catch {
      setStatus("error");
      setError("Upload failed. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    setStatus("idle");
    setError(null);
    onRemoved();
  };

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-1 font-normal text-zinc-400">(required)</span>}
        {!required && <span className="ml-1 font-normal text-zinc-400">(optional)</span>}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Mirrors the uploaded path so the browser's native form validation
          blocks submission until a file has actually uploaded successfully —
          the same mechanism every other required field in this wizard relies on. */}
      {/* `readOnly` would bar this input from HTML5 constraint validation
          entirely (per spec, readonly fields skip `required` checks) — an
          inert onChange keeps it genuinely required while still preventing
          any typed edits from doing anything. */}
      {required && (
        <input
          type="text"
          required
          value={value ?? ""}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      )}

      {status === "uploaded" && value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3.5 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm text-zinc-700">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />
            <span className="truncate">{fileName ?? "Document"}</span>
            <span className="shrink-0 text-xs font-medium text-emerald-700">Uploaded successfully</span>
          </span>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove document"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className={cn(
            "flex h-11 items-center gap-2.5 rounded-xl border border-dashed px-3.5 text-sm font-medium transition-colors",
            status === "error"
              ? "border-red-300 bg-red-50/50 text-red-600"
              : "border-zinc-300 bg-white text-zinc-500 hover:border-blue-400 hover:bg-blue-50/30",
          )}
        >
          {status === "uploading" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4 shrink-0" />
          )}
          {status === "uploading" ? "Uploading..." : "Click to upload (PDF, JPG or PNG, max 10 MB)"}
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
