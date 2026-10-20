import Link from "next/link";
import { CalendarClock, MessageSquare, Tag } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { getTenantLeads } from "@/lib/dashboard";
import { canInTenant } from "@/lib/rbac";
import { getT } from "@/i18n";
import { formatDateTime, formatUsd, timeAgo } from "@/lib/money";
import { SectionCard, StatusPill } from "@/components/dashboard/kpi";
import { ActionButton } from "@/components/dashboard/action-button";
import { EmptyState } from "@/components/ui/empty";
import { NoTenant } from "@/components/dashboard/no-tenant";

export const dynamic = "force-dynamic";

export default async function TenantLeads() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  if (!ctx.activeTenantId) return <NoTenant />;
  const tenantId = ctx.activeTenantId;
  const [leads, canManage] = await Promise.all([getTenantLeads(tenantId), Promise.resolve(canInTenant(ctx, tenantId, "lead:manage"))]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("tenant.leads")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">{t("tenant.analytics.honesty")}</p>
      </div>

      <SectionCard title={t("seller.inquiries")} subtitle={`${leads.conversations.length}`}>
        {leads.conversations.length === 0 ? (
          <EmptyState title={t("tenant.leads.empty")} icon={<MessageSquare className="h-7 w-7" />} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {leads.conversations.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{lead.buyerName}</p>
                  <p className="truncate text-xs text-ink-500">
                    {lead.year} {lead.make} {lead.model} · {lead.listingSlug}
                  </p>
                  <p className="mt-0.5 line-clamp-1 max-w-lg text-[11px] text-ink-400">{lead.lastMessage}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {Number(lead.unread) > 0 ? <span className="chip chip-warn">{lead.unread} new</span> : null}
                  <span className="text-[11px] text-ink-400">{timeAgo(lead.lastMessageAt, lang)}</span>
                  <Link href={`/messages/${lead.id}`} className="btn btn-secondary btn-sm no-underline">Open</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={t("tenant.appointments")}>
        {leads.appointments.length === 0 ? (
          <EmptyState title={t("customer.empty.appointments")} body={t("customer.empty.appointmentsBody")} icon={<CalendarClock className="h-7 w-7" />} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {leads.appointments.map((apt) => (
              <li key={apt.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{apt.buyerName} · {apt.year} {apt.make} {apt.model}</p>
                  <p className="text-xs text-ink-500">{formatDateTime(apt.preferredAt, lang)}{apt.location ? ` · ${apt.location}` : ""}</p>
                  {apt.note ? <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-400">{apt.note}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusPill status={apt.status} />
                  {canManage && apt.status === "REQUESTED" ? (
                    <>
                      <ActionButton endpoint={`/api/tenant/appointments/${apt.id}`} body={{ status: "CONFIRMED" }} label="Confirm" variant="primary" />
                      <ActionButton endpoint={`/api/tenant/appointments/${apt.id}`} body={{ status: "DECLINED" }} label="Decline" variant="ghost" />
                    </>
                  ) : null}
                  {canManage && apt.status === "CONFIRMED" ? (
                    <ActionButton endpoint={`/api/tenant/appointments/${apt.id}`} body={{ status: "COMPLETED" }} label="Mark completed" variant="secondary" />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={lang === "km" ? "ការផ្តល់តម្លៃ" : "Offers"}>
        {leads.offers.length === 0 ? (
          <p className="text-sm text-ink-500">{lang === "km" ? "មិនទាន់មានការផ្តល់តម្លៃទេ។" : "No offers yet."}</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {leads.offers.map((offer) => (
              <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                    <Tag className="h-3.5 w-3.5 text-ink-400" /> {formatUsd(offer.amountUsd)}
                    <span className="font-normal text-ink-500">· {offer.buyerName}</span>
                  </p>
                  <p className="text-xs text-ink-500">{offer.year} {offer.make} {offer.model}</p>
                  {offer.message ? <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-400">{offer.message}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusPill status={offer.status} />
                  {canManage && offer.status === "PENDING" ? (
                    <>
                      <ActionButton endpoint="/api/offers" body={{ offerId: offer.id, action: "accept" }} label="Accept" variant="primary" />
                      <ActionButton endpoint="/api/offers" body={{ offerId: offer.id, action: "decline" }} label="Decline" variant="ghost" />
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
