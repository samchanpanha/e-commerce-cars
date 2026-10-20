import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { getAdminCases, getPendingDocuments } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDateTime, timeAgo } from "@/lib/money";
import { SectionCard, StatusPill } from "@/components/dashboard/kpi";
import { ActionButton, ReasonAction } from "@/components/dashboard/action-button";
import { EmptyState } from "@/components/ui/empty";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminModeration() {
  const [{ lang, t }, cases, docs] = await Promise.all([getT(), getAdminCases(), getPendingDocuments()]);
  const openCases = cases.filter((c) => c.status === "OPEN" || c.status === "REVIEWING");
  const closedCases = cases.filter((c) => c.status !== "OPEN" && c.status !== "REVIEWING").slice(0, 10);
  const pendingDocs = docs.filter((d) => d.status === "PENDING");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("admin.moderation")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">
          {lang === "km"
            ? "ករណីរាយការណ៍ និងឯកសាររង់ចាំការត្រួតពិនិត្យ។ រាល់ការសម្រេចត្រូវកត់ត្រា។"
            : "Reported content and identity documents awaiting review. Every decision is audited; document contents never enter the log."}
        </p>
      </div>

      <SectionCard title="Open cases" subtitle={`${openCases.length}`}>
        {openCases.length === 0 ? (
          <EmptyState title="No open cases" body="Reports from buyers appear here with the listing they relate to." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {openCases.map((item) => (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">
                      {item.reason.replaceAll("_", " ").toLowerCase()} · {item.targetType.toLowerCase()}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {item.listingSlug ? <Link href={`/cars/${item.listingSlug}`} className="no-underline hover:underline">{item.listingSlug}</Link> : item.targetId}
                      {" · "}reported by {item.reporterName}
                    </p>
                    {item.details ? <p className="mt-1 max-w-2xl rounded bg-ink-50 px-2 py-1 text-[11px] text-ink-600">{item.details}</p> : null}
                    <p className="mt-1 text-[10px] text-ink-400">{formatDateTime(item.createdAt, lang)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={item.status} />
                    <div className="flex gap-1.5">
                      <ActionButton endpoint={`/api/admin/cases/${item.id}`} body={{ action: "REVIEWING" }} label="Start review" variant="secondary" />
                      <ReasonAction
                        endpoint={`/api/admin/cases/${item.id}`}
                        body={{ action: "RESOLVED" }}
                        label={t("admin.case.resolve")}
                        field="note"
                        placeholder={t("admin.case.note")}
                        promptLabel={t("admin.case.resolve")}
                        required={false}
                        variant="primary"
                      />
                      <ActionButton endpoint={`/api/admin/cases/${item.id}`} body={{ action: "DISMISSED" }} label={t("admin.case.dismiss")} variant="ghost" confirmText="Dismiss this case?" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Documents awaiting review" subtitle={`${pendingDocs.length}`}>
        {pendingDocs.length === 0 ? (
          <EmptyState title="No documents waiting" body="Seller uploads appear here for identity and registration checks." icon={<FileCheck2 className="h-7 w-7" />} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {pendingDocs.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">
                    {DOCUMENT_TYPE_LABELS[doc.type]?.[lang] ?? doc.type}
                    <span className="ml-2 text-xs font-normal text-ink-500">
                      {doc.year} {doc.make} {doc.model}
                    </span>
                  </p>
                  <p className="truncate text-[11px] text-ink-400">
                    {doc.uploaderName ?? "unknown uploader"} · {timeAgo(doc.uploadedAt, lang)} · {doc.fileName}
                  </p>
                  {doc.note ? <p className="text-[11px] text-ink-500">Note: {doc.note}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm no-underline">
                    Open file
                  </a>
                  <ActionButton endpoint={`/api/admin/documents/${doc.id}`} body={{ status: "VERIFIED" }} label="Verify" variant="primary" />
                  <ActionButton endpoint={`/api/admin/documents/${doc.id}`} body={{ status: "REJECTED" }} label="Reject" variant="danger" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Recently closed" subtitle={`${closedCases.length}`}>
        {closedCases.length === 0 ? (
          <p className="text-sm text-ink-500">Nothing closed yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {closedCases.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink-700">{item.reason.replaceAll("_", " ").toLowerCase()} · {item.targetType.toLowerCase()}</p>
                  <p className="text-[10px] text-ink-400">{formatDateTime(item.createdAt, lang)} · {item.reporterName}</p>
                </div>
                <StatusPill status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
