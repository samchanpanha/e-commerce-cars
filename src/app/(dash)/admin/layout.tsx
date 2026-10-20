import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/rbac";

/**
 * Server-side guard for every /admin page. The API routes enforce their own
 * permissions; this prevents staff-only dashboards from rendering at all for
 * customers, private sellers or dealership members.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx.user) redirect("/login?next=/admin");
  if (!isPlatformStaff(ctx)) redirect("/dashboard");
  return <>{children}</>;
}
