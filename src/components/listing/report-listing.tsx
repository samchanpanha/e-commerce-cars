"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "lucide-react";

export function ReportListingButton({ listingId, isAuthed }: { listingId: string; isAuthed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("SUSPECTED_FRAUD");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [, startTransition] = useTransition();

  if (!isAuthed) {
    return (
      <a href="/login" className="text-[11px] text-ink-400 no-underline hover:text-ink-700">
        Sign in to report this listing
      </a>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-[11px] text-ink-400 hover:text-danger-700">
        <Flag className="h-3 w-3" /> Report this listing
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3">
      <p className="text-xs font-semibold text-ink-900">Report this listing</p>
      <select className="select mt-2 text-xs" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason">
        <option value="SUSPECTED_FRAUD">Suspected fraud or scam</option>
        <option value="DUPLICATE_LISTING">Duplicate listing</option>
        <option value="INCORRECT_INFO">Incorrect information</option>
        <option value="SOLD_ELSEWHERE">Already sold</option>
        <option value="OTHER">Other</option>
      </select>
      <textarea
        className="textarea mt-2 min-h-16 text-xs"
        placeholder="What did you notice? (optional)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1500}
      />
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          className="btn btn-danger btn-sm flex-1"
          disabled={state === "sending"}
          onClick={() => {
            setState("sending");
            startTransition(async () => {
              try {
                const res = await fetch("/api/reports-content", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ targetType: "LISTING", targetId: listingId, listingId, reason, details }),
                });
                if (!res.ok) throw new Error("failed");
                router.replace(`${pathname}?reported=1`);
              } catch {
                setState("error");
              }
            });
          }}
        >
          {state === "sending" ? "Sending…" : "Submit report"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {state === "error" ? <p className="mt-1 text-[11px] text-danger-700">Could not send. Try again.</p> : null}
    </div>
  );
}
