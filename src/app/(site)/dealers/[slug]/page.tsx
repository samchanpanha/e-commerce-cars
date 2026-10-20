import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { BadgeCheck, CalendarDays, Globe, Mail, MapPin, Phone, ShieldCheck, Store } from "lucide-react";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getListingsForTenant } from "@/lib/listings";
import { getT } from "@/i18n";
import { formatDate } from "@/lib/money";
import { CarCard } from "@/components/listing/car-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { CompareBar } from "@/components/listing/compare";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  const tenant = rows[0];
  if (!tenant) return { title: "Dealership not found" };
  return {
    title: `${tenant.name} — cars for sale`,
    description: tenant.descriptionEn ?? `Inventory from ${tenant.name} in ${tenant.province}, Cambodia.`,
  };
}

export default async function DealerStorefront({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ lang, t }, rows] = await Promise.all([
    getT(),
    db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1),
  ]);
  const tenant = rows[0];
  if (!tenant || tenant.status !== "ACTIVE") notFound();

  const cars = await getListingsForTenant(tenant.id);

  return (
    <div>
      <div className="relative h-44 overflow-hidden bg-ink-900 sm:h-56">
        {cars[0]?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cars[0].image} alt="" className="h-full w-full object-cover opacity-45" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-ink-950/30" />
      </div>

      <div className="container-wide">
        <div className="-mt-12 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm sm:-mt-14 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-800">
                <Store className="h-7 w-7" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{tenant.name}</h1>
                  {tenant.verificationStatus === "VERIFIED" ? (
                    <Badge tone="ok" icon={<BadgeCheck className="h-3 w-3" />}>{t("dealer.verification.VERIFIED")}</Badge>
                  ) : (
                    <Badge tone="slate">{t(`dealer.verification.${tenant.verificationStatus}` as Parameters<typeof t>[0])}</Badge>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tenant.province}</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {formatDate(tenant.createdAt, lang)}</span>
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{cars.length} {lang === "km" ? "រថយន្ត" : "cars"}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tenant.phone ? (
                <a href={`tel:${tenant.phone}`} className="btn btn-secondary btn-sm no-underline"><Phone className="h-3.5 w-3.5" />{tenant.phone}</a>
              ) : null}
              {tenant.website ? (
                <a href={tenant.website} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm no-underline"><Globe className="h-3.5 w-3.5" />Website</a>
              ) : null}
              {tenant.email ? (
                <a href={`mailto:${tenant.email}`} className="btn btn-secondary btn-sm no-underline"><Mail className="h-3.5 w-3.5" />Email</a>
              ) : null}
            </div>
          </div>

          {tenant.descriptionEn || tenant.descriptionKm ? (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-600" lang={lang === "km" && tenant.descriptionKm ? "km" : "en"}>
              {(lang === "km" && tenant.descriptionKm) || tenant.descriptionEn}
            </p>
          ) : null}

          <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
            {t("dealer.verifiedExplainer")}
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink-950">{t("dealer.inventory")}</h2>
          {cars.length === 0 ? (
            <div className="mt-4">
              <EmptyState title={t("dealer.noListings")} />
            </div>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((car) => <CarCard key={car.id} car={car} lang={lang} />)}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-[11px] text-ink-400">
          <Link href="/dealers" className="no-underline hover:underline">{t("nav.dealers")}</Link>
          <span aria-hidden> · </span>
          <Link href="/safety" className="no-underline hover:underline">{t("footer.safety")}</Link>
        </p>
      </div>
      <CompareBar />
    </div>
  );
}
