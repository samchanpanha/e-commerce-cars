"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function AcceptInviteButton({ token, label, pendingLabel }: { token: string; label: string; pendingLabel: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not accept the invitation.");
      window.location.assign(json?.data?.redirectTo ?? "/tenant");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept the invitation.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={accept} disabled={busy} className="btn btn-primary w-full justify-center">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? pendingLabel : label}
      </button>
      {error ? <p className="mt-2 text-xs font-medium text-danger-700">{error}</p> : null}
    </div>
  );
}
