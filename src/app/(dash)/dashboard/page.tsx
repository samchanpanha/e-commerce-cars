import { redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { dashboardHome } from "@/lib/rbac";

export default async function DashboardIndex() {
  const ctx = await getAuthContext();
  if (!ctx.user) redirect("/login?next=/dashboard");

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(listings)
    .where(and(eq(listings.sellerId, ctx.user.id), isNull(listings.tenantId)));
  redirect(dashboardHome(ctx, Number(rows[0]?.count ?? 0) > 0));
}
