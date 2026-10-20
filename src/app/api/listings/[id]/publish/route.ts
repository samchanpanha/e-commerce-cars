import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { listings, vehicleImages, vehicles } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/api";
import { canAccessListing, canPlatform } from "@/lib/rbac";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");

    // Moderation staff approve directly; sellers submit into the review queue.
    const isModerator = canPlatform(ctx, "listing:moderate");
    if (!isModerator) {
      const allowed = await canAccessListing(ctx, listing, "listing:publish");
      if (!allowed) throw new ApiError(403, "FORBIDDEN", "You cannot publish this listing.");
      if (!["DRAFT", "REJECTED"].includes(listing.status)) {
        throw new ApiError(409, "INVALID_STATE", "Only drafts or rejected listings can be submitted.");
      }
      const photos = await db.select({ id: vehicleImages.id }).from(vehicleImages).where(eq(vehicleImages.vehicleId, listing.vehicleId));
      if (!photos.length) throw new ApiError(422, "PHOTOS_REQUIRED", "Add at least one photo before submitting.");

      await db.update(listings).set({ status: "PENDING", rejectionReason: null, updatedAt: new Date() }).where(eq(listings.id, id));
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, tenantId: listing.tenantId, action: "listing.submit", targetType: "listing", targetId: id });
      return jsonOk({ status: "PENDING" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    await db
      .update(listings)
      .set({ status: "PUBLISHED", publishedAt: now, expiresAt, rejectionReason: null, updatedAt: now })
      .where(eq(listings.id, id));
    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "listing.approve", targetType: "listing", targetId: id });
    return jsonOk({ status: "PUBLISHED" });
  } catch (err) {
    return jsonError(err);
  }
}
