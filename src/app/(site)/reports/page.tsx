import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileSearch, FileText, ShieldAlert, ShieldCheck } from "lucide-react";
import { getT } from "@/i18n";
import { STATUS_COPY } from "@/i18n/findings";
import type { EvidenceStatus } from "@/lib/report-engine";
import type { TranslationKey } from "@/i18n/dictionary";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Vehicle reports — what was checked and what was not",
  description: "AngkorEV vehicle reports show an evidence ledger for each car: verified records, evidence, inconsistencies, unknowns and sources. Not a score.",
};

const TONES: Record<string, "ok" | "brand" | "warn" | "slate" | "plain"> = {
  green: "ok",
  blue: "brand",
  amber: "warn",
  slate: "slate",
  grey: "plain",
};

const STATUS_ORDER: EvidenceStatus[] = ["VERIFIED_BY_SOURCE", "EVIDENCE_FOUND", "POTENTIAL_INCONSISTENCY", "NOT_VERIFIED", "NO_DATA"];

export default async function ReportsIndexPage() {
  const { lang, t } = await getT();
  const checks: TranslationKey[] = ["reports.checks.1", "reports.checks.2", "reports.checks.3", "reports.checks.4", "reports.checks.5", "reports.checks.6", "reports.checks.7", "reports.checks.8"];
  const cannot: TranslationKey[] = ["reports.cannot.1", "reports.cannot.2", "reports.cannot.3", "reports.cannot.4"];
  const how: TranslationKey[] = ["reports.how.1", "reports.how.2", "reports.how.3"];

  return (
    <div className="container-wide py-9">
      <div className="max-w-3xl">
        <span className="chip chip-brand"><FileText className="h-3 w-3" /> {t("report.title")}</span>
        <h1 className="mt-3 text-2xl font-bold text-ink-950 sm:text-3xl">{t("reports.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{t("reports.sub")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/reports/sample" className="btn btn-primary no-underline">
            {t("reports.sample")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/cars" className="btn btn-secondary no-underline">{t("reports.browse")}</Link>
          <Link href="/customer/reports" className="btn btn-ghost no-underline">{t("reports.mine")}</Link>
        </div>
      </div>

      <section className="mt-9">
        <h2 className="text-lg font-bold text-ink-950">{t("reports.legend.title")}</h2>
        <p className="mt-1 text-sm text-ink-500">{t("reports.legend.sub")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATUS_ORDER.map((status) => {
            const copy = STATUS_COPY[status][lang];
            return (
              <div key={status} className="rounded-xl border border-ink-200 bg-white p-4">
                <Badge tone={TONES[STATUS_COPY[status].tone] ?? "slate"}>{copy.title}</Badge>
                <p className="mt-2 text-xs leading-relaxed text-ink-500">{copy.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink-950">
            <FileSearch className="h-5 w-5 text-brand-600" /> {t("reports.checks.title")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">{t("reports.checks.sub")}</p>
          <ul className="mt-4 space-y-2.5">
            {checks.map((key) => (
              <li key={key} className="flex gap-2.5 text-xs leading-relaxed text-ink-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-danger-200 bg-danger-50/60 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-950">
              <ShieldAlert className="h-5 w-5 text-danger-600" /> {t("reports.cannot.title")}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {cannot.map((key) => (
                <li key={key} className="flex gap-2.5 text-xs leading-relaxed text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger-500" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-900">
              <ShieldCheck className="h-5 w-5" /> {t("reports.how.title")}
            </h2>
            <ol className="mt-3 space-y-2.5">
              {how.map((key, index) => (
                <li key={key} className="flex gap-2.5 text-xs leading-relaxed text-brand-900/85">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{index + 1}</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <p className="mt-6 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-[11px] leading-relaxed text-ink-500">
        {t("report.methodBody")} {t("report.disclaimer")}
      </p>
    </div>
  );
}
