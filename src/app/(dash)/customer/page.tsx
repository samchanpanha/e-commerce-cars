import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CalendarClock, FileSearch, Heart, Search } from "lucide-react";
import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { getCustomerDashboard } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDateTime, formatPricePair } from "@/lib/money";
import { KpiCard, SectionCard, StatusPill } from "@/components/dashboard/kpi";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { RecentlyViewed } from "@/components/listing/recently-viewed";
import { SavedSearchActions } from "@/components/listing/saved-search-actions";

export const dynamic = "force-dynamic";

export default async function CustomerDashboard() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  const [data, searches] = await Promise.all([
    getCustomerDashboard(ctx.user.id),
    db.select().from(savedSearches).where(eq(savedSearches.userId, ctx.user.id)).orderBy(desc(savedSearches.createdAt)).limit(10),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("customer.title")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">{t("dash.welcome", { name: ctx.user.name })}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("customer.favorites")} value={data.favoriteCount} icon={<Heart className="h-4 w-4" />} href="/customer/favorites" />
        <KpiCard label={t("customer.searches")} value={data.searchCount} icon={<Search className="h-4 w-4" />} />
        <KpiCard label={t("customer.appointments")} value={data.appointments.length} icon={<CalendarClock className="h-4 w-4" />} />
        <KpiCard label={t("customer.reports")} value={data.reports.length} icon={<FileSearch className="h-4 w-4" />} href="/customer/reports" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title={t("customer.favorites")} action={<ButtonLink href="/customer/favorites" size="sm" variant="ghost">{t("common.viewAll")}</ButtonLink>}>
          {data.recentFavorites.length === 0 ? (
            <EmptyState title={t("customer.empty.favorites")} body={t("customer.empty.favoritesBody")} icon={<Heart className="h-7 w-7" />} action={<ButtonLink href="/cars" size="sm">{t("nav.browse")}</ButtonLink>} />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.recentFavorites.map((car) => (
                <li key={car.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {car.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={car.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/cars/${car.slug}`} className="block truncate text-sm font-semibold text-ink-900 no-underline hover:text-brand-800">
                      {car.year} {car.make} {car.model}
                    </Link>
                    <p className="text-xs text-ink-500">{formatPricePair(car.priceUsd, lang)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t("customer.appointments")}>
          {data.appointments.length === 0 ? (
            <EmptyState title={t("customer.empty.appointments")} body={t("customer.empty.appointmentsBody")} icon={<CalendarClock className="h-7 w-7" />} />
          ) : (
            <ul className="space-y-2">
              {data.appointments.map((apt) => (
                <li key={apt.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-200 px-3 py-2">
                  <div className="min-w-0">
                    <Link href={`/cars/${apt.slug}`} className="block truncate text-sm font-medium text-ink-900 no-underline hover:text-brand-800">
                      {apt.year} {apt.make} {apt.model}
                    </Link>
                    <p className="text-[11px] text-ink-500">{formatDateTime(apt.preferredAt, lang)}</p>
                  </div>
                  <StatusPill status={apt.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t("customer.reports")} action={<ButtonLink href="/customer/reports" size="sm" variant="ghost">{t("common.viewAll")}</ButtonLink>}>
          {data.reports.length === 0 ? (
            <EmptyState title={t("customer.empty.reports")} body={t("customer.empty.reportsBody")} icon={<FileSearch className="h-7 w-7" />} />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.reports.map((report) => (
                <li key={report.publicId} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{report.year} {report.make} {report.model}</p>
                    <p className="text-[11px] text-ink-400">{report.publicId}</p>
                  </div>
                  <StatusPill status={report.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t("customer.searches")}>
          {searches.length === 0 ? (
            <EmptyState title={t("customer.empty.searches")} body={t("customer.empty.searchesBody")} icon={<Search className="h-7 w-7" />} />
          ) : (
            <ul className="divide-y divide-ink-100">
              {searches.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{s.name}</p>
                    <p className="truncate text-[11px] text-ink-400">?{s.queryJson}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/cars?${s.queryJson}`} className="btn btn-secondary btn-sm no-underline">{t("customer.ss.run")}</Link>
                    <SavedSearchActions id={s.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title={t("customer.recent")}>
        <RecentlyViewed emptyLabel={lang === "km" ? "អ្នកមិនទាន់បានមើលរថយន្តទេ។" : "You have not viewed any cars yet."} />
      </SectionCard>
    </div>
  );
}
