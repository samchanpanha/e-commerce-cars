import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/api";
import { canAccessListing } from "@/lib/rbac";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");
    const allowed = await canAccessListing(ctx, listing, "listing:edit");
    if (!allowed) throw new ApiError(403, "FORBIDDEN", "You cannot update this listing.");

    const now = new Date();
    await db.update(listings).set({ status: "SOLD", soldAt: now, updatedAt: now }).where(eq(listings.id, id));
    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, tenantId: listing.tenantId, action: "listing.mark_sold", targetType: "listing", targetId: id });
    return jsonOk({ status: "SOLD" });
  } catch (err) {
    return jsonError(err);
  }
}
