import type { ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";

export function KpiCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "plain",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  href?: string;
  tone?: "plain" | "brand" | "warn" | "danger" | "ok" | "gold";
}) {
  const tones = {
    plain: "bg-white",
    brand: "bg-brand-50 border-brand-100",
    warn: "bg-warn-100/50 border-warn-100",
    danger: "bg-danger-100/40 border-danger-100",
    ok: "bg-ok-100/50 border-ok-100",
    gold: "bg-gold-100/50 border-gold-300/40",
  } as const;

  const content = (
    <div className={clsx("card p-4", tones[tone], href && "transition hover:border-brand-500")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">{label}</p>
        {icon ? <span className="text-ink-400">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink-950">{typeof value === "number" ? value.toLocaleString("en-US") : value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-ink-500">{hint}</p> : null}
    </div>
  );

  return href ? <Link href={href} className="no-underline">{content}</Link> : content;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("card overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-ink-950">{title}</h2>
          {subtitle ? <p className="text-[11px] text-ink-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: "chip-ok",
    ACTIVE: "chip-ok",
    READY: "chip-ok",
    VERIFIED: "chip-ok",
    CONFIRMED: "chip-ok",
    ACCEPTED: "chip-ok",
    PENDING: "chip-warn",
    REQUESTED: "chip-warn",
    TRIALING: "chip-warn",
    NEEDS_REVIEW: "chip-warn",
    REVIEWING: "chip-warn",
    DRAFT: "chip-slate",
    ARCHIVED: "chip-slate",
    INACTIVE: "chip-slate",
    NONE: "chip-slate",
    DISMISSED: "chip-slate",
    CANCELED: "chip-slate",
    WITHDRAWN: "chip-slate",
    REJECTED: "chip-danger",
    SUSPENDED: "chip-danger",
    FAILED: "chip-danger",
    DECLINED: "chip-danger",
    HIGH: "chip-danger",
    MEDIUM: "chip-warn",
    LOW: "chip-ok",
    UNKNOWN: "chip-slate",
    SOLD: "chip-brand",
    OPEN: "chip-warn",
    RESOLVED: "chip-ok",
  };
  return <span className={clsx("chip", map[status] ?? "chip-slate")}>{status.replaceAll("_", " ").toLowerCase()}</span>;
}
