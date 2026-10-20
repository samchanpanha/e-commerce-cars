"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, ShieldCheck } from "lucide-react";

export function ReportRequest({
  listingId,
  isAuthed,
  existingPublicId,
}: {
  listingId: string;
  isAuthed: boolean;
  existingPublicId?: string | null;
}) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (existingPublicId) {
    return (
      <a href={`/reports/${existingPublicId}`} className="btn btn-secondary w-full no-underline">
        <ShieldCheck className="h-4 w-4" /> View available report
      </a>
    );
  }

  if (!isAuthed) {
    return (
      <a href={`/login?next=/cars`} className="btn btn-secondary w-full no-underline">
        <FileSearch className="h-4 w-4" /> Sign in to request a report
      </a>
    );
  }

  function request() {
    if (!consent) {
      setError("Please confirm you understand what the report covers.");
      return;
    }
    setState("loading");
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, consent: true }),
        });
        const json = await res.json();
        if (res.status === 401) {
          router.push("/login?next=/cars");
          return;
        }
        if (!res.ok) throw new Error(json?.error?.message ?? "Could not generate the report.");
        router.push(`/reports/${json.data.publicId}`);
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Could not generate the report.");
      }
    });
  }

  return (
    <div className="space-y-2.5">
      <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-ink-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 accent-brand-700"
        />
        <span>
          I understand the report uses the seller&apos;s documents and platform records, and is not a physical inspection.
        </span>
      </label>
      <button type="button" onClick={request} className="btn btn-primary w-full" disabled={state === "loading"}>
        <FileSearch className="h-4 w-4" />
        {state === "loading" ? "Generating…" : "Request report"}
      </button>
      {error ? <p className="text-xs font-medium text-danger-700" role="alert">{error}</p> : null}
      <p className="text-center text-[11px] text-ink-400">Free during the pilot · Evidence, sources and limits included</p>
    </div>
  );
}
