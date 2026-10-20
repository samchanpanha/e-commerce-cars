"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Loader2, ShoppingBag, Store } from "lucide-react";
import { clsx } from "clsx";

type AccountType = "BUYER" | "SELLER" | "DEALER";

export function RegisterForm({
  next,
  initialEmail,
  initialType,
}: {
  next?: string;
  initialEmail?: string;
  initialType?: AccountType;
} = {}) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>(initialType ?? "BUYER");
  const [form, setForm] = useState({ name: "", email: initialEmail ?? "", phone: "", password: "", dealerName: "", accept: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          accountType,
          dealerName: accountType === "DEALER" ? form.dealerName : undefined,
          locale: "en",
          acceptTerms: form.accept,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const details = json?.error?.details;
        const first = details && typeof details === "object" ? Object.values(details)[0] : null;
        throw new Error(Array.isArray(first) ? String(first[0]) : json?.error?.message ?? "Could not create the account.");
      }
      router.push(next || json.data.redirectTo || "/customer");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
      setBusy(false);
    }
  }

  const types: { id: AccountType; label: string; icon: React.ReactNode; hint: string }[] = [
    { id: "BUYER", label: "Buy a car", icon: <ShoppingBag className="h-4 w-4" />, hint: "Save cars, request reports" },
    { id: "SELLER", label: "Sell my car", icon: <Car className="h-4 w-4" />, hint: "Private listings" },
    { id: "DEALER", label: "Dealership", icon: <Store className="h-4 w-4" />, hint: "Tenant dashboard and team" },
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="label">I want to</legend>
        <div className="grid grid-cols-3 gap-2">
          {types.map((type) => (
            <label
              key={type.id}
              className={clsx(
                "cursor-pointer rounded-xl border p-2.5 text-center transition",
                accountType === type.id ? "border-brand-600 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:border-ink-300",
              )}
            >
              <input
                type="radio"
                name="accountType"
                value={type.id}
                checked={accountType === type.id}
                onChange={() => setAccountType(type.id)}
                className="sr-only"
              />
              <span className={clsx("mx-auto grid h-8 w-8 place-items-center rounded-lg", accountType === type.id ? "bg-brand-700 text-white" : "bg-ink-100 text-ink-500")}>
                {type.icon}
              </span>
              <span className="mt-1.5 block text-[11px] font-semibold text-ink-900">{type.label}</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-ink-400">{type.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-name" className="label">Full name</label>
          <input id="reg-name" required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="reg-phone" className="label">Phone <span className="font-normal text-ink-400">(optional)</span></label>
          <input id="reg-phone" className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="012 345 678" autoComplete="tel" />
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" className="label">Email</label>
        <input id="reg-email" type="email" required className="input" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
      </div>

      {accountType === "DEALER" ? (
        <div>
          <label htmlFor="reg-dealer" className="label">Dealership name</label>
          <input id="reg-dealer" required className="input" value={form.dealerName} onChange={(e) => set("dealerName", e.target.value)} placeholder="e.g. Angkor Auto Group" />
          <p className="hint">This creates your dealership tenant and public storefront.</p>
        </div>
      ) : null}

      <div>
        <label htmlFor="reg-password" className="label">Password</label>
        <input
          id="reg-password"
          type="password"
          required
          minLength={8}
          className="input"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          autoComplete="new-password"
        />
        <p className="hint">At least 8 characters, with a letter and a number.</p>
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-ink-600">
        <input type="checkbox" checked={form.accept} onChange={(e) => set("accept", e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-700" required />
        <span>I agree to the marketplace rules and understand that AngkorEV reports are evidence summaries, not physical inspections or guarantees.</span>
      </label>

      {error ? <p className="rounded-lg bg-danger-100 px-3 py-2 text-xs font-medium text-danger-700" role="alert">{error}</p> : null}

      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-xs text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 no-underline hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
