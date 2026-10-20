import Link from "next/link";
import { CarFront, Plus } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { getTenantInventory } from "@/lib/dashboard";
import { canInTenant } from "@/lib/rbac";
import { getT } from "@/i18n";
import { formatPricePair, timeAgo } from "@/lib/money";
import { StatusPill } from "@/components/dashboard/kpi";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { ActionButton } from "@/components/dashboard/action-button";
import { NoTenant } from "@/components/dashboard/no-tenant";

export const dynamic = "force-dynamic";

export default async function TenantInventory() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  if (!ctx.activeTenantId) return <NoTenant />;
  const tenantId = ctx.activeTenantId;
  const [rows, canCreate, canEdit] = await Promise.all([
    getTenantInventory(tenantId),
    Promise.resolve(canInTenant(ctx, tenantId, "listing:create")),
    Promise.resolve(canInTenant(ctx, tenantId, "listing:edit")),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("tenant.inventory")}</h1>
          <p className="mt-0.5 text-xs text-ink-500">{rows.length} {lang === "km" ? "រថយន្ត" : "cars"}</p>
        </div>
        {canCreate ? (
          <ButtonLink href="/seller/listings/new" size="sm">
            <Plus className="h-4 w-4" /> {t("dash.createListing")}
          </ButtonLink>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={lang === "km" ? "គ្មានរថយន្តក្នុងស្តុក" : "No cars in inventory"} body={t("seller.emptyBody")} icon={<CarFront className="h-8 w-8" />} action={canCreate ? <ButtonLink href="/seller/listings/new">{t("dash.createListing")}</ButtonLink> : undefined} />
        </div>
      ) : (
        <div className="card mt-4 overflow-x-auto">
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
              {rows.map((car) => (
                <tr key={car.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                        {car.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={car.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/cars/${car.slug}`} className="block truncate text-sm font-semibold text-ink-900 no-underline hover:text-brand-800">
                          {car.year} {car.make} {car.model}
                        </Link>
                        <p className="text-[11px] text-ink-400">{car.mileageKm.toLocaleString("en-US")} km · {timeAgo(car.updatedAt, lang)}</p>
                        {car.rejectionReason ? <p className="text-[10px] text-danger-700">{car.rejectionReason}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-sm font-semibold">{formatPricePair(car.priceUsd, lang)}</td>
                  <td>
                    <div className="flex flex-col items-start gap-1">
                      <StatusPill status={car.status} />
                      {car.featuredUntil && car.featuredUntil > new Date() ? <span className="chip chip-gold">featured</span> : null}
                    </div>
                  </td>
                  <td className="text-right text-xs text-ink-600">{car.views}</td>
                  <td className="text-right text-xs text-ink-600">{car.saves}</td>
                  <td>
                    {canEdit ? (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ButtonLink href={`/seller/listings/${car.id}/edit`} size="sm" variant="secondary" prefetch={false}>{t("seller.edit")}</ButtonLink>
                        {car.status === "PUBLISHED" ? (
                          <ActionButton endpoint={`/api/listings/${car.id}/sold`} method="POST" label={t("seller.markSold")} variant="ghost" />
                        ) : null}
                        {car.status === "DRAFT" || car.status === "REJECTED" ? (
                          <ActionButton endpoint={`/api/listings/${car.id}/publish`} method="POST" label={t("listingForm.submit")} variant="primary" />
                        ) : null}
                      </div>
                    ) : null}
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
