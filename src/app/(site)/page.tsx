import Link from "next/link";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileSearch,
  Gauge,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { listings, reportRequests, tenants, vehicles } from "@/db/schema";
import { EMPTY_FILTERS, searchListings } from "@/lib/listings";
import { getT } from "@/i18n";
import { CarCard } from "@/components/listing/car-card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { lang, t } = await getT();

  const [{ items }, stats] = await Promise.all([
    searchListings({ ...EMPTY_FILTERS, sort: "relevance", pageSize: 12 }),
    loadStats(),
  ]);

  const featured = items.filter((i) => i.featured).slice(0, 3);
  const featuredIds = new Set(featured.map((f) => f.id));
  const recent = items.filter((i) => !featuredIds.has(i.id)).slice(0, 6);
  const makes = facetMakes(items);

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="hero-gradient border-b border-ink-200/70">
        <div className="container-wide grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-16">
          <div className="animate-fade-up">
            <span className="chip chip-brand">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {t("home.hero.badge")}
            </span>
            <h1 className="mt-4 max-w-2xl text-[clamp(2rem,5.4vw,3.4rem)] font-bold leading-[1.08] tracking-tight text-ink-950">
              {t("home.hero.title")}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-500 sm:text-base">
              {t("home.hero.subtitle")}
            </p>

            <form action="/cars" method="get" className="mt-7 max-w-xl" role="search">
              <div className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-[0_16px_40px_-24px_rgba(8,13,18,0.4)] sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
                  <input
                    type="search"
                    name="q"
                    placeholder={t("home.hero.searchPlaceholder")}
                    aria-label={t("home.hero.searchPlaceholder")}
                    className="h-12 w-full rounded-xl border-0 bg-transparent pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <button type="submit" className="btn btn-primary h-12 px-5">
                  {t("home.hero.searchButton")}
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
              <span className="font-medium">{t("home.hero.popular")}:</span>
              {["Toyota", "Lexus", "Ford", "Mazda"].map((make) => (
                <Link
                  key={make}
                  href={`/cars?make=${encodeURIComponent(make)}`}
                  className="chip no-underline hover:border-brand-500 hover:text-brand-800"
                >
                  {make}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-ink-200/70 bg-ink-100 shadow-[0_30px_80px_-40px_rgba(8,13,18,0.55)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-phnom-penh.jpg"
                alt="A silver SUV on a tree-lined street in Phnom Penh at golden hour"
                className="aspect-[16/11] w-full object-cover"
              />
            </div>

            <div className="absolute -bottom-6 left-3 right-3 rounded-2xl border border-ink-200 bg-white/95 p-3.5 shadow-xl backdrop-blur sm:left-6 sm:right-auto sm:w-[320px]">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Vehicle report</span>
                <Badge tone="brand">READY</Badge>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-ink-950">2019 Lexus RX 350</p>
              <div className="mt-2.5 space-y-1.5 text-[11px]">
                <LedgerLine tone="ok" label="Registration card reviewed" meta="Verified" />
                <LedgerLine tone="warn" label="Mileage records missing" meta="No data" />
                <LedgerLine tone="slate" label="Accident history" meta="Not verified" />
              </div>
              <p className="mt-2 border-t border-ink-100 pt-2 text-[10px] leading-relaxed text-ink-400">
                No records found does not mean no accidents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ trust */}
      <section className="border-b border-ink-200/70 bg-white">
        <div className="container-wide grid gap-6 py-8 sm:grid-cols-3">
          <TrustItem icon={<BadgeCheck className="h-5 w-5" />} title={t("home.trust.verified.title")} body={t("home.trust.verified.body")} />
          <TrustItem icon={<FileSearch className="h-5 w-5" />} title={t("home.trust.evidence.title")} body={t("home.trust.evidence.body")} />
          <TrustItem icon={<ShieldCheck className="h-5 w-5" />} title={t("home.trust.privacy.title")} body={t("home.trust.privacy.body")} />
        </div>
      </section>

      {/* ------------------------------------------------------------ featured */}
      {featured.length > 0 ? (
        <section className="container-wide py-12">
          <SectionHead
            title={t("home.featured")}
            sub={t("home.featured.sub")}
            href="/cars?sort=newest"
            linkLabel={t("common.viewAll")}
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((car) => (
              <CarCard key={car.id} car={car} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ brands */}
      <section className="border-y border-ink-200/70 bg-ink-50/70">
        <div className="container-wide py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink-950">{t("home.brands")}</h2>
              <p className="mt-1 text-sm text-ink-500">
                {lang === "km" ? "ម៉ាកពេញនិយមនៅកម្ពុជា" : "Popular makes in the Cambodian market"}
              </p>
            </div>
            <Link href="/cars" className="text-sm font-semibold text-brand-700 no-underline hover:underline">
              {t("nav.browse")} →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {makes.map((m) => (
              <Link
                key={m.name}
                href={`/cars?make=${encodeURIComponent(m.name)}`}
                className="card card-hover flex items-center justify-between p-4 no-underline"
              >
                <span className="text-sm font-semibold text-ink-900">{m.name}</span>
                <span className="chip chip-slate">{m.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ recent */}
      <section className="container-wide py-12">
        <SectionHead title={t("home.recent")} sub={t("home.recent.sub")} href="/cars?sort=newest" linkLabel={t("common.viewAll")} />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((car) => (
            <CarCard key={car.id} car={car} lang={lang} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ how it works */}
      <section className="border-y border-ink-200/70 bg-white">
        <div className="container-wide py-14">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{lang === "km" ? "ដំណើរការ" : "How it works"}</span>
            <h2 className="mt-2 text-2xl font-bold text-ink-950 sm:text-3xl">{t("home.how.title")}</h2>
          </div>
          <ol className="mt-9 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <li key={step} className="card p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-800">
                  {step}
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-950">{t(`home.how.${step}.title` as Parameters<typeof t>[0])}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t(`home.how.${step}.body` as Parameters<typeof t>[0])}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ report teaser */}
      <section className="container-wide py-14">
        <div className="overflow-hidden rounded-3xl bg-ink-950 text-white">
          <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
            <div>
              <span className="chip border-white/20 bg-white/10 text-white">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {lang === "km" ? "ភាពខុសគ្នារបស់យើង" : "What makes this different"}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{t("home.report.title")}</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-200">{t("home.report.body")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/reports/sample" variant="gold" size="md">
                  {t("home.report.cta")} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/reports" variant="secondary" size="md" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  {t("nav.reports")}
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Evidence ledger</span>
                <span className="text-[11px] text-ink-400">12 checks</span>
              </div>
              <div className="mt-3 space-y-2">
                <TeaserRow tone="ok" icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="VIN format valid" status="Evidence found" />
                <TeaserRow tone="ok" icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Registration card reviewed" status="Verified" />
                <TeaserRow tone="warn" icon={<Gauge className="h-3.5 w-3.5" />} label="Odometer records" status="No data" />
                <TeaserRow tone="warn" icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Accident database" status="Not connected" />
                <TeaserRow tone="ok" icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Price vs comparable cars" status="In line" />
                <TeaserRow tone="slate" icon={<Users className="h-3.5 w-3.5" />} label="Seller statement on repairs" status="Not verified" />
              </div>
              <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-ink-400">
                {lang === "km"
                  ? "រាល់ចំណុចបង្ហាញប្រភព និងកាលបរិច្ឆេទ។ អ្វីដែលគ្មានទិន្នន័យ ត្រូវបង្ហាញថាគ្មានទិន្នន័យ។"
                  : "Every row carries a source and a date. What has no data is shown as no data — never as a pass."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ seller/dealer CTA */}
      <section className="container-wide pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card relative overflow-hidden p-7">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-50" aria-hidden />
            <Store className="h-6 w-6 text-brand-700" aria-hidden />
            <h3 className="mt-4 text-lg font-bold text-ink-950">{t("home.cta.sell.title")}</h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{t("home.cta.sell.body")}</p>
            <ButtonLink href="/seller/listings/new" className="mt-5" size="sm">
              {t("home.cta.sell.button")} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="card relative overflow-hidden p-7">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-100/70" aria-hidden />
            <BadgeCheck className="h-6 w-6 text-gold-600" aria-hidden />
            <h3 className="mt-4 text-lg font-bold text-ink-950">{t("home.cta.dealer.title")}</h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{t("home.cta.dealer.body")}</p>
            <ButtonLink href="/pricing" className="mt-5" size="sm" variant="secondary">
              {t("home.cta.dealer.button")} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-ink-200 bg-white p-5 sm:grid-cols-4">
          <Stat value={stats.listings} label={t("home.stats.listings")} />
          <Stat value={stats.dealers} label={t("home.stats.dealers")} />
          <Stat value={stats.reports} label={t("home.stats.reports")} />
          <Stat value={stats.provinces} label={t("home.stats.provinces")} />
        </div>
      </section>
    </>
  );
}

async function loadStats() {
  const now = new Date();
  const [published, dealerCount, reportCount, provinceCount] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(listings).where(and(eq(listings.status, "PUBLISHED"), gte(listings.expiresAt, now))),
    db.select({ c: sql<number>`count(*)` }).from(tenants).where(eq(tenants.status, "ACTIVE")),
    db.select({ c: sql<number>`count(*)` }).from(reportRequests).where(inArray(reportRequests.status, ["READY", "NEEDS_REVIEW"])),
    db.select({ c: sql<number>`count(distinct ${listings.province})` }).from(listings).where(eq(listings.status, "PUBLISHED")),
  ]);
  return {
    listings: Number(published[0]?.c ?? 0),
    dealers: Number(dealerCount[0]?.c ?? 0),
    reports: Number(reportCount[0]?.c ?? 0),
    provinces: Number(provinceCount[0]?.c ?? 0),
  };
}

function facetMakes(items: { make: string }[]) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.make, (counts.get(item.make) ?? 0) + 1);
  const preferred = ["Toyota", "Lexus", "Ford", "Mazda", "Honda", "Hyundai", "Kia", "BYD"];
  const sorted = [...counts.entries()].sort((a, b) => {
    const pa = preferred.indexOf(a[0]);
    const pb = preferred.indexOf(b[0]);
    if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    return b[1] - a[1];
  });
  return sorted.slice(0, 8).map(([name, count]) => ({ name, count }));
}

function TrustItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-ink-950">{title}</h3>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{body}</p>
      </div>
    </div>
  );
}

function SectionHead({ title, sub, href, linkLabel }: { title: string; sub: string; href: string; linkLabel: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-ink-950">{title}</h2>
        <p className="mt-1 text-sm text-ink-500">{sub}</p>
      </div>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 no-underline hover:underline">
        {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tracking-tight text-ink-950">{value.toLocaleString("en-US")}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </div>
  );
}

function LedgerLine({ tone, label, meta }: { tone: "ok" | "warn" | "slate"; label: string; meta: string }) {
  const dot = tone === "ok" ? "bg-ok-600" : tone === "warn" ? "bg-gold-500" : "bg-ink-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span className="flex-1 truncate text-ink-700">{label}</span>
      <span className="shrink-0 text-ink-400">{meta}</span>
    </div>
  );
}

function TeaserRow({ tone, icon, label, status }: { tone: "ok" | "warn" | "slate"; icon: React.ReactNode; label: string; status: string }) {
  const cls = tone === "ok" ? "text-[#7fd1a8]" : tone === "warn" ? "text-gold-300" : "text-ink-400";
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2">
      <span className={cls}>{icon}</span>
      <span className="flex-1 truncate text-xs text-ink-200">{label}</span>
      <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{status}</span>
    </div>
  );
}

export const metadata = {
  title: "AngkorEV — Buy and sell cars in Cambodia with evidence",
};
