import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, FileCheck2, LifeBuoy, ShieldAlert, ShieldCheck, Store } from "lucide-react";
import { getT } from "@/i18n";
import type { TranslationKey } from "@/i18n/dictionary";

export const metadata: Metadata = {
  title: "Safety and trust — how to buy a used car in Cambodia",
  description: "Practical safety guidance for buying a used car in Cambodia, and an honest explanation of what AngkorEV verification can and cannot prove.",
};

function Section({ title, intro, children, icon }: { title: string; intro: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        {icon ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span> : null}
        <div>
          <h2 className="text-base font-bold text-ink-950 sm:text-lg">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">{intro}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function SafetyPage() {
  const { t } = await getT();
  const before: TranslationKey[] = ["safety.before.1", "safety.before.2", "safety.before.3", "safety.before.4", "safety.before.5"];
  const badges: TranslationKey[] = ["safety.badges.1", "safety.badges.2", "safety.badges.3", "safety.badges.4"];
  const report: TranslationKey[] = ["safety.report.1", "safety.report.2", "safety.report.3", "safety.report.4"];

  return (
    <div className="container-wide py-9">
      <div className="mx-auto max-w-3xl">
        <span className="chip chip-ok"><ShieldCheck className="h-3 w-3" /> {t("footer.trust")}</span>
        <h1 className="mt-3 text-2xl font-bold text-ink-950 sm:text-3xl">{t("safety.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{t("safety.sub")}</p>

        <div className="mt-6 space-y-4">
          <Section title={t("safety.before.title")} intro={t("safety.before.intro")} icon={<ShieldAlert className="h-5 w-5" />}>
            <ol className="space-y-3">
              {before.map((key, index) => (
                <li key={key} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-600">{index + 1}</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={t("safety.badges.title")} intro={t("safety.badges.intro")} icon={<BadgeCheck className="h-5 w-5" />}>
            <ul className="space-y-3">
              {badges.map((key) => (
                <li key={key} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t("safety.report.title")} intro={t("safety.report.intro")} icon={<ShieldAlert className="h-5 w-5" />}>
            <ul className="space-y-3">
              {report.map((key) => (
                <li key={key} className="rounded-lg bg-ink-50 px-3 py-2.5 text-sm leading-relaxed text-ink-700">{t(key)}</li>
              ))}
            </ul>
            <Link href="/reports/sample" className="btn btn-secondary btn-sm mt-4 no-underline">{t("safety.report.cta")}</Link>
          </Section>

          <Section title={t("safety.reportProblem.title")} intro={t("safety.reportProblem.intro")} icon={<LifeBuoy className="h-5 w-5" />}>
            <div className="flex flex-wrap gap-2">
              <Link href="/cars" className="btn btn-primary btn-sm no-underline">{t("nav.browse")}</Link>
              <a href="mailto:support@angkorev.kh" className="btn btn-secondary btn-sm no-underline">{t("safety.reportProblem.cta")}</a>
            </div>
          </Section>

          <Section title={t("safety.dealer.title")} intro={t("safety.dealer.intro")} icon={<Store className="h-5 w-5" />}>
            <div className="flex flex-wrap gap-2">
              <Link href="/pricing" className="btn btn-primary btn-sm no-underline">{t("safety.dealer.cta")}</Link>
              <Link href="/dealers" className="btn btn-secondary btn-sm no-underline">{t("nav.dealers")}</Link>
            </div>
          </Section>
        </div>

        <p className="mt-6 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-[11px] leading-relaxed text-ink-500">
          {t("safety.disclaimer")}
        </p>
      </div>
    </div>
  );
}
