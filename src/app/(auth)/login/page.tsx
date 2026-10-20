import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-950">Sign in</h1>
      <p className="mt-1 text-sm text-ink-500">Manage your listings, inquiries and vehicle reports.</p>

      <div className="mt-6">
        <LoginForm next={next} />
      </div>

      <div className="mt-7 rounded-xl border border-dashed border-ink-300 bg-ink-50 p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Demo accounts</p>
        <p className="mt-0.5 text-[11px] text-ink-500">
          Seeded demonstration data · password <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px]">{DEMO_PASSWORD}</code>
        </p>
        <ul className="mt-2 space-y-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email} className="flex flex-wrap items-baseline justify-between gap-1 text-[11px]">
              <span className="font-mono text-ink-700">{account.email}</span>
              <span className="text-ink-400">{account.role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-ink-400">
          Tenant isolation, role permissions and the moderation queue can be tested with these accounts.
        </p>
      </div>

      <p className="mt-4 text-center text-[11px] text-ink-400">
        <Link href="/" className="no-underline hover:underline">Continue browsing without an account</Link>
      </p>
    </div>
  );
}
