import Link from "next/link";
import { FileSearch } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { listReportsForUser } from "@/lib/reports";
import { getT } from "@/i18n";
import { formatDateTime } from "@/lib/money";
import { StatusPill } from "@/components/dashboard/kpi";
import { EmptyState } from "@/components/ui/empty";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MyReportsPage() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  const reports = await listReportsForUser(ctx.user.id);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("customer.reports")}</h1>
      <p className="mt-1 text-xs text-ink-500">{t("report.disclaimer")}</p>

      {reports.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={t("customer.empty.reports")}
            body={t("customer.empty.reportsBody")}
            icon={<FileSearch className="h-8 w-8" />}
            action={<ButtonLink href="/cars">{t("nav.browse")}</ButtonLink>}
          />
        </div>
      ) : (
        <div className="card mt-5 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Car</th>
                <th>{t("report.publicId")}</th>
                <th>{t("common.status")}</th>
                <th>{t("report.confidence")}</th>
                <th>{t("report.generated")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.publicId}>
                  <td className="font-medium text-ink-900">
                    {report.year} {report.make} {report.model}
                  </td>
                  <td className="font-mono text-xs text-ink-500">{report.publicId}</td>
                  <td><StatusPill status={report.status} /></td>
                  <td>
                    <Badge tone={(report.confidence ?? 0) >= 60 ? "ok" : (report.confidence ?? 0) >= 40 ? "warn" : "slate"}>
                      {report.confidence ?? 0}%
                    </Badge>
                  </td>
                  <td className="text-xs text-ink-500">{formatDateTime(report.completedAt ?? report.requestedAt, lang)}</td>
                  <td>
                    <Link href={`/reports/${report.publicId}`} className="btn btn-secondary btn-sm no-underline">
                      {t("report.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
