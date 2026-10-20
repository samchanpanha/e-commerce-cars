import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/rbac";

/**
 * Dealership dashboards require an active membership (or platform staff access
 * for support). Tenant identity always comes from the session membership.
 */
export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx.user) redirect("/login?next=/tenant");
  const hasActiveMembership = ctx.memberships.some((m) => m.tenantStatus === "ACTIVE");
  if (!hasActiveMembership && !isPlatformStaff(ctx)) redirect("/dashboard");
  return <>{children}</>;
}
