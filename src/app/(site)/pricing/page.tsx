import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, ShieldCheck } from "lucide-react";
import { getT } from "@/i18n";
import type { TranslationKey } from "@/i18n/dictionary";

export const metadata: Metadata = {
  title: "Dealership plans — pilot pricing",
  description: "AngkorEV dealership plans. Prices are labelled pilot hypotheses, not final commercial terms.",
};

type Plan = {
  key: string;
  name: TranslationKey;
  price: TranslationKey;
  body: TranslationKey;
  listings: number;
  featured: number | null;
  included: TranslationKey[];
  excluded: TranslationKey[];
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    key: "free",
    name: "pricing.free",
    price: "pricing.free.price",
    body: "pricing.free.body",
    listings: 5,
    featured: null,
    included: ["pricing.feature.listing", "pricing.feature.reports"],
    excluded: ["pricing.feature.team", "pricing.feature.analytics"],
  },
  {
    key: "growth",
    name: "pricing.growth",
    price: "pricing.growth.price",
    body: "pricing.growth.body",
    listings: 30,
    featured: 2,
    included: ["pricing.feature.listing", "pricing.feature.featured", "pricing.feature.team", "pricing.feature.reports", "pricing.feature.analytics"],
    excluded: [],
    highlighted: true,
  },
  {
    key: "pro",
    name: "pricing.pro",
    price: "pricing.pro.price",
    body: "pricing.pro.body",
    listings: 100,
    featured: 8,
    included: ["pricing.feature.listing", "pricing.feature.featured", "pricing.feature.team", "pricing.feature.reports", "pricing.feature.analytics", "pricing.feature.support"],
    excluded: [],
  },
];

export default async function PricingPage() {
  const { t } = await getT();

  return (
    <div className="container-wide py-10">
      <div className="mx-auto max-w-2xl text-center">
        <span className="chip chip-gold"><ShieldCheck className="h-3 w-3" /> Pilot</span>
        <h1 className="mt-3 text-2xl font-bold text-ink-950 sm:text-3xl">{t("pricing.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{t("pricing.sub")}</p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative flex flex-col rounded-2xl border bg-white p-5 ${
              plan.highlighted ? "border-brand-300 shadow-[0_18px_40px_-30px_rgba(13,110,106,0.55)]" : "border-ink-200"
            }`}
          >
            {plan.highlighted ? (
              <span className="absolute -top-3 left-5 chip chip-brand bg-brand-600 text-white">Most dealers start here</span>
            ) : null}
            <h2 className="text-base font-bold text-ink-950">{t(plan.name)}</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">{t(plan.body)}</p>
            <p className="mt-4 text-2xl font-bold text-ink-950">{t(plan.price)}</p>
            <p className="text-[11px] text-ink-400">{plan.key === "free" ? t("pricing.note") : t("pricing.billed")}</p>

            <ul className="mt-4 flex-1 space-y-2 text-xs text-ink-700">
              {plan.included.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok-600" />
                  <span>{t(key, key === "pricing.feature.listing" ? { count: plan.listings } : key === "pricing.feature.featured" && plan.featured ? { count: plan.featured } : undefined)}</span>
                </li>
              ))}
              {plan.excluded.map((key) => (
                <li key={key} className="flex items-start gap-2 text-ink-400">
                  <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.key === "free" ? "/register?type=DEALER" : "/register?type=DEALER&plan=" + plan.key}
              className={`btn mt-5 justify-center no-underline ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}
            >
              {plan.key === "free" ? t("nav.register") : t("pricing.cta")}
            </Link>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <h2 className="text-lg font-bold text-ink-950">{t("pricing.faq.title")}</h2>
        <div className="mt-3 divide-y divide-ink-100 rounded-2xl border border-ink-200 bg-white">
          {(["1", "2", "3"] as const).map((n) => (
            <div key={n} className="p-4">
              <h3 className="text-sm font-semibold text-ink-900">{t(`pricing.faq.${n}.q` as TranslationKey)}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{t(`pricing.faq.${n}.a` as TranslationKey)}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-warn-200 bg-warn-50 px-4 py-3 text-[11px] leading-relaxed text-warn-900">
          {t("pricing.note")}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <h2 className="text-sm font-bold text-brand-900">{t("safety.dealer.title")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-brand-900/80">{t("safety.dealer.intro")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/register?type=DEALER" className="btn btn-primary btn-sm no-underline">{t("nav.sell")}</Link>
          <Link href="/dealers" className="btn btn-secondary btn-sm no-underline">{t("nav.dealers")}</Link>
        </div>
      </div>
    </div>
  );
}
