import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getAdminPendingListings } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatPricePair, timeAgo } from "@/lib/money";
import { StatusPill } from "@/components/dashboard/kpi";
import { ActionButton, ReasonAction } from "@/components/dashboard/action-button";
import { EmptyState } from "@/components/ui/empty";

export const dynamic = "force-dynamic";

export default async function AdminListings() {
  const [{ lang, t }, rows] = await Promise.all([getT(), getAdminPendingListings()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("admin.listings")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">
          {lang === "km"
            ? "ការផ្សាយដែលរង់ចាំ ឬត្រូវបានបដិសេធ។ ការអនុម័តបង្ហាញភ្លាមៗ។"
            : "Listings awaiting review or previously rejected. Approval publishes immediately; the seller is notified."}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Review queue is clear" body="New listings appear here as soon as sellers submit them." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const flags = parseFlags(row.moderationFlags);
            return (
              <article key={row.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                      {row.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.image} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <div className="min-w-0">
                      <Link href={`/cars/${row.slug}`} className="block truncate text-sm font-semibold text-ink-900 no-underline hover:text-brand-800">
                        {row.year} {row.make} {row.model}
                      </Link>
                      <p className="text-xs text-ink-500">
                        {formatPricePair(row.priceUsd, lang)} · {row.sellerName}
                        {row.tenantName ? ` · ${row.tenantName}` : " · private seller"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-400">Submitted {timeAgo(row.createdAt, lang)}</p>
                      {flags.length ? (
                        <ul className="mt-1.5 flex flex-wrap gap-1">
                          {flags.map((flag) => (
                            <li key={flag} className="chip chip-warn">
                              <AlertTriangle className="h-3 w-3" /> {flag.replaceAll("_", " ").toLowerCase()}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-ok-700">No automated flags</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={row.status} />
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <ActionButton endpoint={`/api/admin/listings/${row.id}`} body={{ action: "APPROVE" }} label={t("admin.listing.approve")} variant="primary" />
                      <ReasonAction
                        endpoint={`/api/admin/listings/${row.id}`}
                        body={{ action: "REJECT" }}
                        label={t("admin.listing.reject")}
                        placeholder={t("admin.listing.rejectReason")}
                        promptLabel={t("admin.listing.reject")}
                        minLength={5}
                      />
                      <ActionButton endpoint={`/api/admin/listings/${row.id}`} body={{ action: "ARCHIVE" }} label={t("seller.archive")} variant="ghost" confirmText="Archive this listing?" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function parseFlags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((f) => (typeof f === "string" ? f : f?.code)).filter(Boolean) : [];
  } catch {
    return [];
  }
}
