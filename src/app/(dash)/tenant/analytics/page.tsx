import { getAuthContext } from "@/lib/auth";
import { getTenantDashboard } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatPricePair } from "@/lib/money";
import { KpiCard, SectionCard } from "@/components/dashboard/kpi";
import { NoTenant } from "@/components/dashboard/no-tenant";

export const dynamic = "force-dynamic";

export default async function TenantAnalytics() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  if (!ctx.activeTenantId) return <NoTenant />;
  const data = await getTenantDashboard(ctx.activeTenantId);
  const maxViews = Math.max(1, ...data.inventory.map((i) => i.views));
  const maxSaves = Math.max(1, ...data.inventory.map((i) => Number(i.saves)));
  const statusRows = [
    { key: "DRAFT", value: data.status.DRAFT },
    { key: "PENDING", value: data.status.PENDING },
    { key: "PUBLISHED", value: data.status.PUBLISHED },
    { key: "SOLD", value: data.status.SOLD },
    { key: "ARCHIVED", value: data.status.ARCHIVED },
  ];
  const totalLeads = data.leads.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("tenant.analytics")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">{t("tenant.analytics.honesty")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("tenant.views")} value={data.views} />
        <KpiCard label={t("tenant.inquiries")} value={data.contacts} />
        <KpiCard label={t("tenant.favorites")} value={data.favorites} />
        <KpiCard label={t("tenant.upcoming")} value={data.upcomingAppointments} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title={t("tenant.analytics.viewsByCar")}>
          <ul className="space-y-2.5">
            {data.inventory.map((car) => (
              <li key={car.id}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-ink-700">{car.year} {car.make} {car.model}</span>
                  <span className="shrink-0 font-semibold text-ink-900">{car.views}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${(car.views / maxViews) * 100}%` }} />
                </div>
                <p className="mt-0.5 text-[10px] text-ink-400">{formatPricePair(car.priceUsd, lang)} · {car.saves} saves</p>
              </li>
            ))}
            {data.inventory.length === 0 ? <li className="text-sm text-ink-500">No inventory yet.</li> : null}
          </ul>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title={t("tenant.analytics.leadsByStatus")}>
            <ul className="space-y-2">
              {statusRows.map((row) => (
                <li key={row.key} className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2">
                  <span className="text-xs font-medium text-ink-700">{row.key.toLowerCase()}</span>
                  <span className="text-sm font-bold text-ink-900">{row.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-ink-400">{totalLeads} recent conversations · not verified sales.</p>
          </SectionCard>

          <SectionCard title={t("tenant.analytics.saves")}>
            <ul className="space-y-2">
              {data.inventory.slice(0, 5).map((car) => (
                <li key={car.id}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-ink-700">{car.make} {car.model}</span>
                    <span className="font-semibold text-ink-900">{car.saves}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${(Number(car.saves) / maxSaves) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
