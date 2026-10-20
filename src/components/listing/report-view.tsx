import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  Clock,
  FileWarning,
  MinusCircle,
  ShieldAlert,
} from "lucide-react";
import { CATEGORY_COPY, STATUS_COPY, findingCopy } from "@/i18n/findings";
import { translate, type Lang } from "@/i18n/dictionary";
import { formatDateTime } from "@/lib/money";
import type { EvidenceStatus } from "@/lib/report-engine";
import type { ReportRecord } from "@/lib/reports";
import { Badge } from "@/components/ui/badge";

const statusTone: Record<EvidenceStatus, "ok" | "brand" | "warn" | "slate" | "danger"> = {
  VERIFIED_BY_SOURCE: "ok",
  EVIDENCE_FOUND: "brand",
  POTENTIAL_INCONSISTENCY: "warn",
  NOT_VERIFIED: "slate",
  NO_DATA: "slate",
};

function statusIcon(status: EvidenceStatus) {
  switch (status) {
    case "VERIFIED_BY_SOURCE": return <BadgeCheck className="h-3.5 w-3.5" aria-hidden />;
    case "EVIDENCE_FOUND": return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />;
    case "POTENTIAL_INCONSISTENCY": return <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
    case "NOT_VERIFIED": return <MinusCircle className="h-3.5 w-3.5" aria-hidden />;
    default: return <CircleDashed className="h-3.5 w-3.5" aria-hidden />;
  }
}

export function ReportView({
  record,
  lang,
  sample = false,
  disputeSlot,
}: {
  record: ReportRecord;
  lang: Lang;
  sample?: boolean;
  disputeSlot?: React.ReactNode;
}) {
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(lang, key, vars);
  const { report, findings, vehicle, listing } = record;
  const summary = lang === "km" ? report.summaryKm ?? report.summaryEn : report.summaryEn;
  const limitations = lang === "km" ? report.limitationsKm ?? report.limitationsEn : report.limitationsEn;

  const counts = {
    verified: findings.filter((f) => f.status === "VERIFIED_BY_SOURCE").length,
    evidence: findings.filter((f) => f.status === "EVIDENCE_FOUND").length,
    inconsistencies: findings.filter((f) => f.status === "POTENTIAL_INCONSISTENCY").length,
    unverified: findings.filter((f) => f.status === "NOT_VERIFIED").length,
    noData: findings.filter((f) => f.status === "NO_DATA").length,
  };

  const categories = [...new Set(findings.map((f) => f.category))];

  return (
    <div className="space-y-6">
      {/* header */}
      <header className="card overflow-hidden">
        <div className="border-b border-ink-100 bg-ink-50/70 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">{t("report.title")}</p>
              <h1 className="mt-1 text-xl font-bold text-ink-950 sm:text-2xl">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="mt-1 text-xs text-ink-500">
                {t("report.publicId")} <span className="font-mono font-semibold text-ink-700">{report.publicId}</span>
                <span aria-hidden> · </span>
                {t("report.generated")} {formatDateTime(report.completedAt ?? report.requestedAt, lang)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {sample ? <Badge tone="gold">{t("report.sample")}</Badge> : null}
              <Badge tone={report.status === "READY" ? "ok" : report.status === "NEEDS_REVIEW" ? "warn" : "slate"}>
                {t(`report.status.${report.status}` as Parameters<typeof t>[0])}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:px-6 md:grid-cols-[200px_1fr]">
          <ConfidenceDial value={report.confidence ?? 0} label={t("report.confidence")} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t("report.risk")}</span>
              <Badge tone={report.riskLevel === "HIGH" ? "danger" : report.riskLevel === "MEDIUM" ? "warn" : report.riskLevel === "LOW" ? "ok" : "slate"}>
                {t(`report.risk.${report.riskLevel ?? "UNKNOWN"}` as Parameters<typeof t>[0])}
              </Badge>
              {listing ? (
                <Link href={`/cars/${listing.slug}`} className="text-xs font-semibold text-brand-700 no-underline hover:underline">
                  {lang === "km" ? "មើលការផ្សាយ" : "View listing"} →
                </Link>
              ) : null}
            </div>
            <p className="prose-copy mt-2">{summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Count label={t("report.verified")} value={counts.verified} tone="bg-ok-100 text-ok-700" />
              <Count label={t("report.evidenceFound")} value={counts.evidence} tone="bg-brand-50 text-brand-800" />
              <Count label={t("report.inconsistencies")} value={counts.inconsistencies} tone="bg-warn-100 text-warn-700" />
              <Count label={t("report.unverified")} value={counts.unverified} tone="bg-ink-100 text-ink-600" />
              <Count label={t("report.noData")} value={counts.noData} tone="bg-ink-100 text-ink-600" />
            </div>
          </div>
        </div>
      </header>

      {/* limitations — deliberately above the findings */}
      <section className="rounded-2xl border border-warn-100 bg-warn-100/40 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-warn-700">
          <ShieldAlert className="h-4 w-4" aria-hidden /> {t("report.limitations")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">{limitations}</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-500">{t("report.disclaimer")}</p>
      </section>

      {/* evidence ledger */}
      <section className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-ink-950">{t("report.evidence")}</h2>
          <p className="mt-0.5 text-xs text-ink-500">{t("report.evidenceSub")}</p>
        </div>

        <div className="divide-y divide-ink-100">
          {categories.map((category) => (
            <div key={category} className="px-5 py-4 sm:px-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400">
                {CATEGORY_COPY[category as keyof typeof CATEGORY_COPY]?.[lang] ?? category}
              </h3>
              <ul className="mt-2 space-y-2.5">
                {findings.filter((f) => f.category === category).map((finding) => {
                  const copy = findingCopy(finding.code, lang);
                  const status = finding.status as EvidenceStatus;
                  const data = parseData(finding.dataJson);
                  return (
                    <li key={finding.id} className="rounded-xl border border-ink-200/80 p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className={status === "POTENTIAL_INCONSISTENCY" ? "mt-0.5 text-warn-600" : status === "VERIFIED_BY_SOURCE" || status === "EVIDENCE_FOUND" ? "mt-0.5 text-ok-600" : "mt-0.5 text-ink-400"}>
                            {statusIcon(status)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink-950">{copy.title}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{copy.description}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {finding.confidence != null ? (
                            <span className="text-[10px] font-medium text-ink-400">{finding.confidence}% conf.</span>
                          ) : null}
                          <Badge tone={statusTone[status]} className="whitespace-nowrap">
                            {STATUS_COPY[status]?.[lang].title ?? finding.status}
                          </Badge>
                        </div>
                      </div>

                      {data && Object.keys(data).length > 0 ? (
                        <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-ink-50 px-3 py-2 sm:grid-cols-3">
                          {Object.entries(data).slice(0, 6).map(([key, value]) => (
                            <div key={key} className="min-w-0">
                              <dt className="truncate text-[10px] uppercase tracking-wide text-ink-400">{key}</dt>
                              <dd className="truncate text-[11px] font-medium text-ink-700">{formatValue(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}

                      {finding.sourceRef ? (
                        <p className="mt-2 flex items-center gap-1 text-[10px] text-ink-400">
                          <FileWarning className="h-3 w-3" aria-hidden /> {t("report.source")}: <span className="font-mono">{finding.sourceRef}</span>
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-3 text-[11px] text-ink-500 sm:px-6">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Provider {report.provider} v{report.version} · {t("report.findings", { count: findings.length })}
          </span>
          {disputeSlot}
        </div>
      </section>

      {/* method + checklist */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-950">
            <CircleHelp className="h-4 w-4 text-ink-400" aria-hidden /> {t("report.method")}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-600">{t("report.methodBody")}</p>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-bold text-ink-950">{t("report.buyerChecklist")}</h2>
          <ul className="mt-2 space-y-1.5">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex items-start gap-2 text-xs leading-relaxed text-ink-600">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
                {t(`report.checklist.${n}` as Parameters<typeof t>[0])}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ConfidenceDial({ value, label }: { value: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const color = value >= 60 ? "var(--color-ok-600)" : value >= 40 ? "var(--color-gold-500)" : "var(--color-danger-600)";
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`${label}: ${value}%`}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-ink-100)" strokeWidth="9" />
          <circle
            cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="9"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-xl font-bold text-ink-950">{value}%</span>
        </div>
      </div>
      <p className="max-w-24 text-[11px] font-semibold uppercase leading-tight tracking-wide text-ink-400">{label}</p>
    </div>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-lg px-2.5 py-2 ${tone}`}>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function parseData(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return Array.isArray(value) ? `${value.length} items` : JSON.stringify(value).slice(0, 60);
  return String(value);
}
