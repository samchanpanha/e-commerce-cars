"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload } from "lucide-react";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/constants";

export type DocRow = {
  id: string;
  type: string;
  status: string;
  fileName: string | null;
  uploadedAt: Date | string;
};

export function DocumentUploader({ listingId, documents, canUpload }: { listingId: string; documents: DocRow[]; canUpload: boolean }) {
  const router = useRouter();
  const [type, setType] = useState<string>(DOCUMENT_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  async function upload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      form.append("note", note);
      const res = await fetch(`/api/listings/${listingId}/documents`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed.");
      setNote("");
      if (inputRef.current) inputRef.current.value = "";
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-ink-950">
        <FileText className="h-4 w-4 text-ink-400" /> Documents
      </h2>
      <p className="mt-1 text-xs text-ink-500">
        Registration, import and service documents are private. Our team reviews them; only the review status appears publicly.
      </p>

      {documents.length ? (
        <ul className="mt-3 divide-y divide-ink-100 rounded-xl border border-ink-200">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-ink-900">
                  {DOCUMENT_TYPE_LABELS[doc.type]?.en ?? doc.type}
                </p>
                <p className="truncate text-[10px] text-ink-400">{doc.fileName ?? "document"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`chip ${doc.status === "VERIFIED" ? "chip-ok" : doc.status === "REJECTED" ? "chip-danger" : "chip-warn"}`}>
                  {doc.status.toLowerCase()}
                </span>
                <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-brand-700 no-underline hover:underline">
                  Open
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">No documents uploaded yet.</p>
      )}

      {canUpload ? (
        <div className="mt-3 space-y-2 rounded-xl border border-ink-200 bg-ink-50/60 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select className="select !py-2 text-xs" value={type} onChange={(e) => setType(e.target.value)} aria-label="Document type">
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt} value={dt}>{DOCUMENT_TYPE_LABELS[dt]?.en ?? dt}</option>
              ))}
            </select>
            <input className="input !py-2 text-xs" placeholder="Optional note (e.g. front and back)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          </div>
          <input
            ref={inputRef}
            id="doc-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={(e) => upload(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="doc-file" className={`btn btn-secondary btn-sm w-full cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {busy ? "Uploading…" : "Upload document"}
          </label>
          <p className="text-[10px] leading-relaxed text-ink-400">
            JPG, PNG, WebP or PDF up to 10 MB. Documents are stored outside the public web root.
          </p>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs font-medium text-danger-700" role="alert">{error}</p> : null}
    </section>
  );
}
