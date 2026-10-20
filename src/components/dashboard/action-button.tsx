"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

const variants: Record<string, string> = {
  primary: "btn btn-primary btn-sm",
  secondary: "btn btn-secondary btn-sm",
  danger: "btn btn-danger btn-sm",
  ghost: "btn btn-ghost btn-sm",
  gold: "btn btn-gold btn-sm",
};

export function ActionButton({
  endpoint,
  method = "PATCH",
  body,
  label,
  pendingLabel = "Working…",
  confirmText,
  variant = "secondary",
  className,
  onDone,
  disabled,
}: {
  endpoint: string;
  method?: "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  label: string;
  pendingLabel?: string;
  confirmText?: string;
  variant?: keyof typeof variants;
  className?: string;
  onDone?: "refresh" | "reload" | "none";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(endpoint, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error?.message ?? "Action failed.");
        if (onDone === "reload") window.location.reload();
        else if (onDone !== "none") router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={run} disabled={pending || disabled} className={clsx(variants[variant], className)}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {pending ? pendingLabel : label}
      </button>
      {error ? <span className="text-[10px] font-medium text-danger-700">{error}</span> : null}
    </span>
  );
}

/** Action that requires a written reason (suspensions, rejections, resolutions). */
export function ReasonAction({
  endpoint,
  method = "PATCH",
  body,
  label,
  field = "reason",
  placeholder = "Explain the decision. This is written to the audit log and shown to the seller.",
  required = true,
  variant = "danger",
  promptLabel = "Confirm",
  minLength = 5,
}: {
  endpoint: string;
  method?: "POST" | "PATCH";
  body?: Record<string, unknown>;
  label: string;
  field?: string;
  placeholder?: string;
  required?: boolean;
  variant?: keyof typeof variants;
  promptLabel?: string;
  minLength?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" className={variants[variant]} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-ink-200 bg-white p-2.5 shadow-sm">
      <textarea
        className="textarea min-h-16 text-xs"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={500}
        autoFocus
      />
      {error ? <p className="mt-1 text-[10px] font-medium text-danger-700">{error}</p> : null}
      <div className="mt-1.5 flex gap-1.5">
        <button
          type="button"
          className={clsx(variants[variant], "flex-1")}
          disabled={pending || (required && value.trim().length < minLength)}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const res = await fetch(endpoint, {
                  method,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...body, [field]: value.trim() }),
                });
                const json = await res.json().catch(() => null);
                if (!res.ok) throw new Error(json?.error?.message ?? "Action failed.");
                setOpen(false);
                setValue("");
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Action failed.");
              }
            });
          }}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? "Working…" : promptLabel}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
