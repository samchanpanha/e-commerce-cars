import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { listings, notifications, offers } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canAccessListing } from "@/lib/rbac";
import { newId } from "@/lib/ids";
import { offerSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    const body = await parseBody(req, offerSchema.extend({ listingId: z.string().optional() }));

    const handle = req.nextUrl.searchParams.get("listingId") ?? body.listingId;
    if (!handle) throw new ApiError(400, "MISSING_LISTING", "listingId is required.");
    const rows = await db.select().from(listings).where(eq(listings.id, handle)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");
    if (listing.sellerId === ctx.user.id) throw new ApiError(400, "OWN_LISTING", "You cannot offer on your own listing.");
    if (listing.status !== "PUBLISHED") throw new ApiError(409, "NOT_AVAILABLE", "This car is not open for offers.");

    const id = newId("off");
    await db.insert(offers).values({
      id,
      listingId: listing.id,
      buyerId: ctx.user.id,
      tenantId: listing.tenantId,
      amountUsd: body.amountUsd,
      message: body.message || null,
      status: "PENDING",
    });

    await db.insert(notifications).values({
      id: newId("ntf"),
      userId: listing.sellerId,
      type: "OFFER",
      titleKey: "notifications.newInquiry",
      dataJson: JSON.stringify({ car: listing.slug, amount: body.amountUsd }),
      link: `/tenant/leads`,
    });

    await audit({ actorId: ctx.user.id, tenantId: listing.tenantId, action: "offer.create", targetType: "listing", targetId: listing.id, metadata: { offerId: id, amountUsd: body.amountUsd } });
    return jsonOk({ id, status: "PENDING" }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

const respondSchema = z.object({
  offerId: z.string().min(1),
  action: z.enum(["accept", "decline"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireUser();
    const body = await parseBody(req, respondSchema);

    const rows = await db.select().from(offers).where(eq(offers.id, body.offerId)).limit(1);
    const offer = rows[0];
    if (!offer) throw new ApiError(404, "NOT_FOUND", "Offer not found.");

    const listingRows = await db.select().from(listings).where(eq(listings.id, offer.listingId)).limit(1);
    const listing = listingRows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");

    const allowed = await canAccessListing(ctx, listing, "lead:manage");
    if (!allowed) throw new ApiError(403, "FORBIDDEN", "You cannot respond to this offer.");
    if (offer.status !== "PENDING") throw new ApiError(409, "ALREADY_HANDLED", "This offer was already handled.");

    await db
      .update(offers)
      .set({ status: body.action === "accept" ? "ACCEPTED" : "DECLINED", respondedAt: new Date() })
      .where(and(eq(offers.id, offer.id), eq(offers.status, "PENDING")));

    await db.insert(notifications).values({
      id: newId("ntf"),
      userId: offer.buyerId,
      type: "OFFER_RESPONSE",
      titleKey: body.action === "accept" ? "notifications.offerAccepted" : "notifications.offerDeclined",
      dataJson: JSON.stringify({ car: listing.slug, amount: offer.amountUsd }),
      link: `/cars/${listing.slug}`,
    });

    await audit({ actorId: ctx.user.id, tenantId: listing.tenantId, action: `offer.${body.action}`, targetType: "offer", targetId: offer.id });
    return jsonOk({ status: body.action === "accept" ? "ACCEPTED" : "DECLINED" });
  } catch (err) {
    return jsonError(err);
  }
}
