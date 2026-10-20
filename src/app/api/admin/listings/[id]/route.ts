import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { listings, notifications } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canPlatform } from "@/lib/rbac";
import { newId } from "@/lib/ids";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("APPROVE") }),
  z.object({ action: z.literal("REJECT"), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal("ARCHIVE") }),
  z.object({ action: z.literal("FEATURE"), days: z.number().int().min(1).max(60).default(14) }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    if (!canPlatform(ctx, "listing:moderate")) throw new ApiError(403, "FORBIDDEN", "Moderation access required.");

    const body = await parseBody(req, schema);
    const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");

    const now = new Date();
    if (body.action === "APPROVE") {
      await db.update(listings).set({
        status: "PUBLISHED",
        publishedAt: now,
        expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        rejectionReason: null,
        updatedAt: now,
      }).where(eq(listings.id, id));
      await db.insert(notifications).values({
        id: newId("ntf"), userId: listing.sellerId, type: "LISTING_APPROVED",
        titleKey: "notifications.listingApproved", dataJson: JSON.stringify({ car: listing.slug }), link: `/cars/${listing.slug}`,
      });
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "listing.approve", targetType: "listing", targetId: id });
      return jsonOk({ status: "PUBLISHED" });
    }

    if (body.action === "REJECT") {
      await db.update(listings).set({ status: "REJECTED", rejectionReason: body.reason, updatedAt: now }).where(eq(listings.id, id));
      await db.insert(notifications).values({
        id: newId("ntf"), userId: listing.sellerId, type: "LISTING_REJECTED",
        titleKey: "notifications.listingRejected", dataJson: JSON.stringify({ car: listing.slug, reason: body.reason }), link: `/seller/listings/${id}/edit`,
      });
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "listing.reject", targetType: "listing", targetId: id, metadata: { reason: body.reason } });
      return jsonOk({ status: "REJECTED" });
    }

    if (body.action === "ARCHIVE") {
      await db.update(listings).set({ status: "ARCHIVED", updatedAt: now }).where(eq(listings.id, id));
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "listing.archive", targetType: "listing", targetId: id });
      return jsonOk({ status: "ARCHIVED" });
    }

    const featuredUntil = new Date(now.getTime() + body.days * 24 * 60 * 60 * 1000);
    await db.update(listings).set({ featuredUntil, updatedAt: now }).where(eq(listings.id, id));
    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "listing.feature", targetType: "listing", targetId: id, metadata: { days: body.days } });
    return jsonOk({ featuredUntil });
  } catch (err) {
    return jsonError(err);
  }
}
