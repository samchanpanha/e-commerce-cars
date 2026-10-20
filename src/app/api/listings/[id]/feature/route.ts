import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/api";
import { canAccessListing, canInTenant } from "@/lib/rbac";

/** Demo feature placement. In production this is gated by a paid subscription or admin grant. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");

    const isAdmin = ctx.user.platformRole === "SUPER_ADMIN";
    const allowed = isAdmin
      ? true
      : listing.tenantId
        ? canInTenant(ctx, listing.tenantId, "listing:feature")
        : listing.sellerId === ctx.user.id;
    if (!allowed) throw new ApiError(403, "FORBIDDEN", "You cannot feature this listing.");
    if (listing.status !== "PUBLISHED") throw new ApiError(409, "INVALID_STATE", "Only published listings can be featured.");

    const featuredUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await db.update(listings).set({ featuredUntil }).where(eq(listings.id, id));
    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, tenantId: listing.tenantId, action: "listing.feature", targetType: "listing", targetId: id, metadata: { featuredUntil } });
    return jsonOk({ featuredUntil });
  } catch (err) {
    return jsonError(err);
  }
}
