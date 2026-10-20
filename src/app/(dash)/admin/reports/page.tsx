import Link from "next/link";
import { getAdminReports } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDateTime } from "@/lib/money";
import { StatusPill } from "@/components/dashboard/kpi";
import { ActionButton, ReasonAction } from "@/components/dashboard/action-button";
import { EmptyState } from "@/components/ui/empty";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function AdminReports() {
  const [{ lang, t }, reports] = await Promise.all([getT(), getAdminReports()]);
  const needsReview = reports.filter((r) => r.status === "NEEDS_REVIEW");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("admin.reports")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">
          {lang === "km"
            ? "របាយការណ៍ដែលបង្កើតដោយម៉ាស៊ីន។ របាយការណ៍ដែលមានភាពមិនស៊ីគ្នាធ្ងន់ធ្ងរត្រូវការការត្រួតពិនិត្យដោយមនុស្ស។"
            : "Machine-generated reports. A report with a critical inconsistency, or thin evidence, is routed to human review before it is treated as final."}
        </p>
      </div>

      {needsReview.length > 0 ? (
        <Alert tone="warning" title={`${needsReview.length} report(s) need review`}>
          Review the evidence ledger, then approve or send back. The requester sees the current state.
        </Alert>
      ) : null}

      {reports.length === 0 ? (
        <EmptyState title="No reports yet" body="Reports are generated when a buyer requests one from a listing." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>{t("report.publicId")}</th>
                <th>{t("common.status")}</th>
                <th>{t("report.confidence")}</th>
                <th>{t("report.risk")}</th>
                <th>{t("report.generated")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <p className="text-sm font-medium text-ink-900">{report.year} {report.make} {report.model}</p>
                    {report.listingSlug ? (
                      <Link href={`/cars/${report.listingSlug}`} className="text-[11px] text-brand-700 no-underline hover:underline">
                        {report.listingSlug}
                      </Link>
                    ) : null}
                  </td>
                  <td className="font-mono text-[11px] text-ink-500">{report.publicId}</td>
                  <td><StatusPill status={report.status} /></td>
                  <td className="text-xs text-ink-600">{report.confidence ?? 0}%</td>
                  <td><StatusPill status={report.riskLevel ?? "UNKNOWN"} /></td>
                  <td className="text-xs text-ink-500">{formatDateTime(report.requestedAt, lang)}</td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Link href={`/reports/${report.publicId}`} className="btn btn-secondary btn-sm no-underline">Open</Link>
                      <ActionButton endpoint={`/api/admin/reports/${report.id}`} body={{ action: "RERUN" }} label={t("admin.report.rerun")} variant="ghost" />
                      <ActionButton endpoint={`/api/admin/reports/${report.id}`} body={{ action: "APPROVE" }} label={t("admin.report.markReady")} variant="primary" />
                      <ReasonAction
                        endpoint={`/api/admin/reports/${report.id}`}
                        body={{ action: "SEND_BACK" }}
                        label={t("admin.report.sendBack")}
                        field="note"
                        placeholder="Explain what needs to be checked."
                        promptLabel="Send back"
                        required={false}
                        variant="secondary"
                      />
                    </div>
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
