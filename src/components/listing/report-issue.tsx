"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";

export function ReportIssue({ reportPublicId }: { reportPublicId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("INCORRECT_INFO");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [, startTransition] = useTransition();

  if (state === "sent") {
    return <p className="text-xs font-medium text-ok-700">Thank you. Our team will review this report.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        <Flag className="h-3.5 w-3.5" /> Report an error in this report
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
      <label htmlFor="dispute-reason" className="label">What is wrong?</label>
      <select id="dispute-reason" className="select mb-2" value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="INCORRECT_INFO">Information is incorrect</option>
        <option value="HIDDEN_DAMAGE">A finding is misleading</option>
        <option value="SUSPECTED_FRAUD">I suspect fraud</option>
        <option value="OTHER">Something else</option>
      </select>
      <textarea
        className="textarea min-h-20"
        placeholder="Tell us what should be corrected and what evidence you have."
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1500}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={state === "sending"}
          onClick={() => {
            setState("sending");
            startTransition(async () => {
              try {
                const res = await fetch(`/api/reports/${reportPublicId}/dispute`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reason, details }),
                });
                if (!res.ok) throw new Error("failed");
                setState("sent");
              } catch {
                setState("error");
              }
            });
          }}
        >
          {state === "sending" ? "Sending…" : "Send"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {state === "error" ? <p className="mt-1 text-xs text-danger-700">Could not send. Try again.</p> : null}
    </div>
  );
}
