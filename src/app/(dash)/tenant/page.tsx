import Link from "next/link";
import { eq } from "drizzle-orm";
import { BadgeCheck, CalendarClock, CarFront, Eye, Heart, MessageSquare, Plus, Users } from "lucide-react";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { getTenantDashboard } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDate, formatPricePair, timeAgo } from "@/lib/money";
import { KpiCard, SectionCard, StatusPill } from "@/components/dashboard/kpi";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty";
import { NoTenant } from "@/components/dashboard/no-tenant";

export const dynamic = "force-dynamic";

export default async function TenantOverview() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  if (!ctx.activeTenantId) return <NoTenant />;

  const [data, tenantRows] = await Promise.all([
    getTenantDashboard(ctx.activeTenantId),
    db.select().from(tenants).where(eq(tenants.id, ctx.activeTenantId)).limit(1),
  ]);
  const tenant = tenantRows[0];
  if (!tenant) return <NoTenant />;

  const quota = data.plan?.quota ?? 10;
  const used = data.status.PUBLISHED + data.status.PENDING;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{tenant.name}</h1>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
            {tenant.verificationStatus === "VERIFIED" ? (
              <span className="inline-flex items-center gap-1 font-medium text-brand-700"><BadgeCheck className="h-3.5 w-3.5" /> {t("dealer.verification.VERIFIED")}</span>
            ) : (
              <span>{t(`dealer.verification.${tenant.verificationStatus}` as Parameters<typeof t>[0])}</span>
            )}
            <span aria-hidden>·</span>
            <Link href={`/dealers/${tenant.slug}`} className="no-underline hover:text-brand-800">/dealers/{tenant.slug}</Link>
          </p>
        </div>
        <ButtonLink href={`/seller/listings/new`} size="sm">
          <Plus className="h-4 w-4" /> {t("dash.createListing")}
        </ButtonLink>
      </div>

      {tenant.status === "SUSPENDED" ? (
        <Alert tone="danger" title="This dealership is suspended">
          {tenant.suspensionReason ?? "Contact platform support for details."}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("tenant.published")} value={data.status.PUBLISHED} hint={t("tenant.listingsTotal")} icon={<CarFront className="h-4 w-4" />} href="/tenant/inventory" />
        <KpiCard label={t("tenant.views")} value={data.views} icon={<Eye className="h-4 w-4" />} />
        <KpiCard label={t("tenant.inquiries")} value={data.contacts} icon={<MessageSquare className="h-4 w-4" />} href="/tenant/leads" />
        <KpiCard label={t("tenant.favorites")} value={data.favorites} icon={<Heart className="h-4 w-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title={t("tenant.quota")} subtitle={data.plan?.name ?? "Free pilot"}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-ink-950">{used} <span className="text-sm font-medium text-ink-400">/ {quota}</span></p>
              <p className="mt-0.5 text-xs text-ink-500">{t("tenant.quotaUsed", { used, quota })}</p>
            </div>
            <ButtonLink href="/pricing" size="sm" variant="secondary">{t("tenant.subscription")}</ButtonLink>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (used / quota) * 100)}%` }} />
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat label={t("tenant.draft")} value={data.status.DRAFT} />
            <MiniStat label={t("tenant.pending")} value={data.status.PENDING} />
            <MiniStat label={t("tenant.sold")} value={data.status.SOLD} />
          </ul>
        </SectionCard>

        <SectionCard title={t("tenant.upcoming")} action={<ButtonLink href="/tenant/leads" size="sm" variant="ghost">{t("common.viewAll")}</ButtonLink>}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-800"><CalendarClock className="h-5 w-5" /></span>
            <div>
              <p className="text-2xl font-bold text-ink-950">{data.upcomingAppointments}</p>
              <p className="text-xs text-ink-500">{lang === "km" ? "ការណាត់ជួបដែលបានបញ្ជាក់ ឬរង់ចាំ" : "requested or confirmed appointments"}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-ink-500">
              <Users className="h-4 w-4" /> {data.teamCount} {t("dealer.team")}
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
            {t("tenant.analytics.honesty")}
          </p>
        </SectionCard>
      </div>

      <SectionCard title={t("tenant.leads")} action={<ButtonLink href="/tenant/leads" size="sm" variant="ghost">{t("common.viewAll")}</ButtonLink>}>
        {data.leads.length === 0 ? (
          <EmptyState title={t("tenant.leads.empty")} icon={<MessageSquare className="h-7 w-7" />} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.leads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">{lead.buyerName}</p>
                  <p className="truncate text-xs text-ink-500">{lead.listingSlug ?? "General inquiry"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {Number(lead.unread) > 0 ? <span className="chip chip-warn">{lead.unread} new</span> : null}
                  <span className="text-[11px] text-ink-400">{timeAgo(lead.lastMessageAt, lang)}</span>
                  <Link href={`/messages/${lead.id}`} className="btn btn-secondary btn-sm no-underline">Open</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={t("tenant.inventory")} action={<ButtonLink href="/tenant/inventory" size="sm" variant="ghost">{t("common.viewAll")}</ButtonLink>}>
        {data.inventory.length === 0 ? (
          <EmptyState title={lang === "km" ? "គ្មានរថយន្តក្នុងស្តុក" : "No cars in inventory"} body={t("seller.emptyBody")} icon={<CarFront className="h-7 w-7" />} action={<ButtonLink href="/seller/listings/new" size="sm">{t("dash.createListing")}</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.inventory.slice(0, 5).map((car) => (
              <li key={car.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link href={`/cars/${car.slug}`} className="block truncate text-sm font-medium text-ink-900 no-underline hover:text-brand-800">
                    {car.year} {car.make} {car.model}
                  </Link>
                  <p className="text-[11px] text-ink-400">{formatPricePair(car.priceUsd, lang)} · {car.views} views · {car.saves} saves</p>
                </div>
                <StatusPill status={car.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <p className="text-center text-[11px] text-ink-400">
        {t("tenant.brandingHint", { slug: tenant.slug })} · {formatDate(tenant.createdAt, lang)}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-lg bg-ink-50 px-2 py-2">
      <p className="text-base font-bold text-ink-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-400">{label}</p>
    </li>
  );
}
