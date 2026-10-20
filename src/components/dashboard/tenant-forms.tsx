"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, UserPlus } from "lucide-react";

export function InviteStaffForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SALES_AGENT");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/tenant/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId, email, role }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "Could not create the invitation.");
        setInviteUrl(json.data.inviteUrl);
        setEmail("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the invitation.");
      }
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
        <input
          type="email"
          required
          className="input"
          placeholder="staff@dealership.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Staff email"
        />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="SALES_AGENT">Sales agent</option>
          <option value="INVENTORY_MANAGER">Inventory manager</option>
          <option value="TENANT_ADMIN">Dealership admin</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Invite
        </button>
      </form>
      {error ? <p className="mt-1 text-xs font-medium text-danger-700" role="alert">{error}</p> : null}
      {inviteUrl ? (
        <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2">
          <p className="text-[11px] text-brand-900">Share this one-time invitation link (valid 7 days):</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="truncate rounded bg-white px-2 py-1 text-[11px] text-ink-800">{inviteUrl}</code>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}${inviteUrl}`);
                } catch {
                  /* clipboard unavailable */
                }
              }}
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
          <p className="mt-1 text-[10px] text-brand-800">
            Email delivery is not enabled in this environment. In production the invitation is sent by the notification worker.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function TenantSettingsForm({
  tenant,
}: {
  tenant: {
    id: string;
    name: string;
    descriptionEn: string | null;
    descriptionKm: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    addressLine: string | null;
    province: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: tenant.name,
    descriptionEn: tenant.descriptionEn ?? "",
    descriptionKm: tenant.descriptionKm ?? "",
    phone: tenant.phone ?? "",
    email: tenant.email ?? "",
    website: tenant.website ?? "",
    addressLine: tenant.addressLine ?? "",
    province: tenant.province,
  });
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            const res = await fetch("/api/tenant/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tenantId: tenant.id, ...form }),
            });
            if (!res.ok) throw new Error("failed");
            setState("saved");
            router.refresh();
          } catch {
            setState("error");
          }
        });
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="t-name">Dealership name</label>
          <input id="t-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label" htmlFor="t-province">Province</label>
          <input id="t-province" className="input" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="t-phone">Phone</label>
          <input id="t-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="t-email">Public email</label>
          <input id="t-email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="t-address">Address</label>
          <input id="t-address" className="input" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="t-desc-en">Description (English)</label>
          <textarea id="t-desc-en" className="textarea" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} maxLength={1500} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="t-desc-km">Description (Khmer)</label>
          <textarea id="t-desc-km" lang="km" className="textarea" value={form.descriptionKm} onChange={(e) => setForm({ ...form, descriptionKm: e.target.value })} maxLength={1500} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
        </button>
        {state === "saved" ? <span className="text-xs font-medium text-ok-700">Saved.</span> : null}
        {state === "error" ? <span className="text-xs font-medium text-danger-700">Could not save.</span> : null}
      </div>
    </form>
  );
}
