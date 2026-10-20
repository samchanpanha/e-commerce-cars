import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { BadgeCheck, MapPin, Store } from "lucide-react";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getT } from "@/i18n";
import { formatDate } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dealerships and verified sellers in Cambodia",
  description: "Browse Cambodian car dealerships. Every verification badge explains exactly what AngkorEV checked.",
};

export default async function DealersPage() {
  const [{ lang, t }, rows] = await Promise.all([
    getT(),
    db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        province: tenants.province,
        descriptionEn: tenants.descriptionEn,
        descriptionKm: tenants.descriptionKm,
        verificationStatus: tenants.verificationStatus,
        verifiedAt: tenants.verifiedAt,
        createdAt: tenants.createdAt,
        listings: sql<number>`(select count(*) from listings l where l.tenant_id = tenants.id and l.status = 'PUBLISHED')`,
        image: sql<string | null>`(select vi.url from listings l join vehicle_images vi on vi.vehicle_id = l.vehicle_id where l.tenant_id = tenants.id and l.status = 'PUBLISHED' order by vi.position asc limit 1)`,
      })
      .from(tenants)
      .where(eq(tenants.status, "ACTIVE"))
      .orderBy(asc(tenants.name)),
  ]);

  return (
    <div className="container-wide py-9">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">{t("dealer.directory")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{t("dealer.directorySub")}</p>
        <p className="mt-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[11px] leading-relaxed text-brand-900">
          {t("dealer.verifiedExplainer")}
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((dealer) => (
          <Link key={dealer.id} href={`/dealers/${dealer.slug}`} className="card card-hover overflow-hidden no-underline">
            <div className="relative h-32 bg-ink-100">
              {dealer.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dealer.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-ink-300"><Store className="h-8 w-8" /></div>
              )}
              {dealer.verificationStatus === "VERIFIED" ? (
                <span className="absolute left-2.5 top-2.5 chip chip-ok shadow-sm">
                  <BadgeCheck className="h-3 w-3" /> {t("dealer.verification.VERIFIED")}
                </span>
              ) : null}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-bold text-ink-950">{dealer.name}</h2>
                <span className="chip chip-slate shrink-0">{dealer.listings} cars</span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                <MapPin className="h-3.5 w-3.5" /> {dealer.province}
              </p>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-500">
                {(lang === "km" && dealer.descriptionKm) || dealer.descriptionEn || (lang === "km" ? "សាលដេឡារថយន្តនៅកម្ពុជា។" : "A car dealership in Cambodia.")}
              </p>
              <p className="mt-2 text-[10px] text-ink-400">
                {dealer.verifiedAt ? `${t("dealer.verifiedSince")} ${formatDate(dealer.verifiedAt, lang)}` : t("dealer.notVerified")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
