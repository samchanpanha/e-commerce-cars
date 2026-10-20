import Link from "next/link";
import { AlertTriangle, CarFront, FileSearch, Store, Users } from "lucide-react";
import { getAdminDashboard } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDateTime, timeAgo } from "@/lib/money";
import { KpiCard, SectionCard } from "@/components/dashboard/kpi";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [{ lang, t }, data] = await Promise.all([getT(), getAdminDashboard()]);
  const published = data.listings.PUBLISHED ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("admin.title")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">
          {lang === "km" ? "ទិដ្ឋភាពវេទិកាទាំងមូល។ រាល់សកម្មភាពរសើបត្រូវកត់ត្រា។" : "Platform-wide view. Every sensitive action is written to the audit log."}
        </p>
      </div>

      {data.openCases > 0 || data.pendingListings > 0 || data.needsReview > 0 ? (
        <Alert tone="warning" title="Items need a human decision">
          <span className="flex flex-wrap gap-3">
            <Link href="/admin/moderation" className="font-semibold underline">{data.openCases} moderation cases</Link>
            <Link href="/admin/listings" className="font-semibold underline">{data.pendingListings} listings awaiting review</Link>
            <Link href="/admin/reports" className="font-semibold underline">{data.needsReview} reports flagged for review</Link>
          </span>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("admin.usersTotal")} value={data.users} icon={<Users className="h-4 w-4" />} href="/admin/users" />
        <KpiCard label={t("admin.tenantsTotal")} value={data.tenants} icon={<Store className="h-4 w-4" />} href="/admin/tenants" />
        <KpiCard label={t("admin.publishedTotal")} value={published} icon={<CarFront className="h-4 w-4" />} href="/admin/listings" />
        <KpiCard label={t("admin.openCases")} value={data.openCases} tone={data.openCases > 0 ? "warn" : "plain"} icon={<AlertTriangle className="h-4 w-4" />} href="/admin/moderation" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("admin.pendingTotal")} value={data.pendingListings} />
        <KpiCard label={lang === "km" ? "របាយការណ៍សរុប" : "Reports generated"} value={Object.values(data.reports).reduce((a, b) => a + b, 0)} icon={<FileSearch className="h-4 w-4" />} href="/admin/reports" />
        <KpiCard label={lang === "km" ? "ត្រូវត្រួតពិនិត្យ" : "Reports flagged"} value={data.needsReview} />
        <KpiCard label={t("admin.revenue")} value={`$${data.mrr.toLocaleString("en-US")}`} hint="Hypothesis — billing not enabled" tone="gold" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title={t("admin.recentUsers")} action={<ButtonLink href="/admin/users" size="sm" variant="ghost">{t("common.viewAll")}</ButtonLink>}>
          <ul className="divide-y divide-ink-100">
            {data.recentUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
                  <p className="truncate text-[11px] text-ink-400">{user.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {user.role !== "USER" ? <span className="chip chip-brand">{user.role}</span> : null}
                  <span className="text-[11px] text-ink-400">{timeAgo(user.createdAt, lang)}</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={t("admin.recentAudit")} action={<ButtonLink href="/admin/audit" size="sm" variant="ghost">{t("common.viewAll")}</ButtonLink>}>
          <ul className="divide-y divide-ink-100">
            {data.recentAudit.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{event.action}</p>
                  <p className="truncate text-[11px] text-ink-400">
                    {event.actorName ?? "system"} · {event.targetType ?? "—"}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-ink-400">{formatDateTime(event.createdAt, lang)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
