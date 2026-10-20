import Link from "next/link";
import { AlertTriangle, CarFront, Eye, Heart, MessageSquare, Plus, ShieldCheck } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { getSellerDashboard } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatPricePair, timeAgo } from "@/lib/money";
import { KpiCard, SectionCard, StatusPill } from "@/components/dashboard/kpi";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty";
import { ActionButton } from "@/components/dashboard/action-button";

export const dynamic = "force-dynamic";

export default async function SellerDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  const data = await getSellerDashboard(ctx.user.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("seller.title")}</h1>
          <p className="mt-0.5 text-xs text-ink-500">{t("dash.welcome", { name: ctx.user.name })}</p>
        </div>
        <ButtonLink href="/seller/listings/new" size="sm">
          <Plus className="h-4 w-4" /> {t("dash.createListing")}
        </ButtonLink>
      </div>

      {sp.submitted === "1" ? (
        <Alert tone="success" title={t("listingForm.submitted")}>
          {lang === "km"
            ? "ក្រុមការងារយើងនឹងពិនិត្យក្នុងរយៈពេល 24 ម៉ោង។ អ្នកនឹងទទួលបានការជូនដំណឹង។"
            : "Our team reviews new listings within one working day. You will get a notification when it is live."}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("tenant.published")} value={data.status.PUBLISHED} hint={t("seller.myListings")} icon={<CarFront className="h-4 w-4" />} />
        <KpiCard label={t("seller.stats.views")} value={data.views} icon={<Eye className="h-4 w-4" />} />
        <KpiCard label={t("seller.stats.messages")} value={data.contacts} icon={<MessageSquare className="h-4 w-4" />} />
        <KpiCard label={t("tenant.upcoming")} value={data.upcomingAppointments} icon={<ShieldCheck className="h-4 w-4" />} />
      </div>

      <SectionCard
        title={t("seller.myListings")}
        subtitle={`${data.totalListings} ${lang === "km" ? "ការផ្សាយ" : "listings"}`}
        action={<ButtonLink href="/seller/listings/new" size="sm" variant="secondary"><Plus className="h-3.5 w-3.5" /> New</ButtonLink>}
      >
        {data.inventory.length === 0 ? (
          <EmptyState
            title={t("seller.empty")}
            body={t("seller.emptyBody")}
            icon={<CarFront className="h-8 w-8" />}
            action={<ButtonLink href="/seller/listings/new">{t("seller.createFirst")}</ButtonLink>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Car</th>
                  <th>{t("common.price")}</th>
                  <th>{t("common.status")}</th>
                  <th className="text-right">Views</th>
                  <th className="text-right">Saves</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.inventory.map((row) => {
                  const flags = safeFlags(row.moderationFlags);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <Link href={`/cars/${row.slug}`} className="block truncate text-sm font-semibold text-ink-900 no-underline hover:text-brand-800">
                              {row.year} {row.make} {row.model}
                            </Link>
                            <p className="text-[11px] text-ink-400">{timeAgo(row.updatedAt, lang)}</p>
                            {row.status === "REJECTED" && row.rejectionReason ? (
                              <p className="mt-0.5 max-w-xs text-[11px] text-danger-700">{t("seller.rejectedReason")}: {row.rejectionReason}</p>
                            ) : null}
                            {flags.length > 0 ? (
                              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-warn-700">
                                <AlertTriangle className="h-3 w-3" /> {flags.length} moderation flag{flags.length === 1 ? "" : "s"}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-sm font-semibold">{formatPricePair(row.priceUsd, lang)}</td>
                      <td><StatusPill status={row.status} /></td>
                      <td className="text-right text-xs text-ink-600">{row.views}</td>
                      <td className="text-right text-xs text-ink-600">{row.saves}</td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <ButtonLink href={`/seller/listings/${row.id}/edit`} size="sm" variant="secondary" prefetch={false}>{t("seller.edit")}</ButtonLink>
                          {row.status === "PUBLISHED" ? (
                            <>
                              <ActionButton endpoint={`/api/listings/${row.id}/sold`} method="POST" label={t("seller.markSold")} variant="secondary" />
                              <ActionButton endpoint={`/api/listings/${row.id}/feature`} method="POST" label={t("listingForm.feature")} variant="ghost" />
                            </>
                          ) : null}
                          {row.status === "DRAFT" || row.status === "REJECTED" ? (
                            <ActionButton endpoint={`/api/listings/${row.id}/publish`} method="POST" label={t("listingForm.submit")} variant="primary" />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("seller.inquiries")} subtitle={t("tenant.analytics.honesty")}>
        {data.leads.length === 0 ? (
          <p className="text-sm text-ink-500">{t("tenant.leads.empty")}</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.leads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">{lead.buyerName}</p>
                  <p className="truncate text-xs text-ink-500">{lead.listingSlug}</p>
                </div>
                <div className="flex items-center gap-2">
                  {Number(lead.unread) > 0 ? <span className="chip chip-warn">{lead.unread} new</span> : null}
                  <Link href={`/messages/${lead.id}`} className="btn btn-secondary btn-sm no-underline">Open</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function safeFlags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((f) => (typeof f === "string" ? f : f?.code)).filter(Boolean) : [];
  } catch {
    return [];
  }
}
