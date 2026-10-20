import Link from "next/link";
import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { canInTenant } from "@/lib/rbac";
import { getT } from "@/i18n";
import { formatDate } from "@/lib/money";
import { SectionCard, StatusPill } from "@/components/dashboard/kpi";
import { TenantSettingsForm } from "@/components/dashboard/tenant-forms";
import { NoTenant } from "@/components/dashboard/no-tenant";

export const dynamic = "force-dynamic";

export default async function TenantSettings() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  if (!ctx.activeTenantId) return <NoTenant />;
  const rows = await db.select().from(tenants).where(eq(tenants.id, ctx.activeTenantId)).limit(1);
  const tenant = rows[0];
  if (!tenant) return <NoTenant />;
  const canManage = canInTenant(ctx, tenant.id, "tenant:manage");

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("tenant.settings")}</h1>
          <p className="mt-0.5 text-xs text-ink-500">{t("tenant.brandingHint", { slug: tenant.slug })}</p>
        </div>
        <Link href={`/dealers/${tenant.slug}`} className="btn btn-secondary btn-sm no-underline">
          <ExternalLink className="h-3.5 w-3.5" /> {lang === "km" ? "មើលហាង" : "View storefront"}
        </Link>
      </div>

      <SectionCard title={t("tenant.branding")}>
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-ink-50 p-3">
          <div>
            <p className="text-xs font-semibold text-ink-900">{t("common.status")}</p>
            <div className="mt-1 flex gap-1.5">
              <StatusPill status={tenant.status} />
              <StatusPill status={tenant.verificationStatus} />
            </div>
          </div>
          <p className="text-[11px] text-ink-500">{t("dealer.verifiedExplainer")}</p>
        </div>
        {canManage ? (
          <TenantSettingsForm
            tenant={{
              id: tenant.id,
              name: tenant.name,
              descriptionEn: tenant.descriptionEn,
              descriptionKm: tenant.descriptionKm,
              phone: tenant.phone,
              email: tenant.email,
              website: tenant.website,
              addressLine: tenant.addressLine,
              province: tenant.province,
            }}
          />
        ) : (
          <p className="text-sm text-ink-500">{t("tenant.ownerOnly")}</p>
        )}
      </SectionCard>

      <SectionCard title={t("tenant.subscription")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-900">{tenant.name}</p>
            <p className="text-xs text-ink-500">Joined {formatDate(tenant.createdAt, lang)}</p>
          </div>
          <Link href="/pricing" className="btn btn-secondary btn-sm no-underline">View plans</Link>
        </div>
        <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
          Billing is not enabled in this prototype. Plan limits exist in the schema so quotas can be enforced when subscriptions launch.
        </p>
      </SectionCard>
    </div>
  );
}
