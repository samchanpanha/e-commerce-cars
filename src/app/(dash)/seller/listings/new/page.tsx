import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { canInTenant } from "@/lib/rbac";
import { ListingWizard, emptyWizard } from "@/components/listing/listing-wizard";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const ctx = await getAuthContext();
  if (!ctx.user) redirect("/login?next=/seller/listings/new");

  // A dealership member's listing belongs to the active tenant, so quotas, leads
  // and team permissions apply. Private sellers create listing without a tenant.
  const tenantId =
    ctx.activeTenantId && canInTenant(ctx, ctx.activeTenantId, "listing:create") ? ctx.activeTenantId : null;

  return <ListingWizard initial={emptyWizard} mode="create" tenantId={tenantId} />;
}
