import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { appointments, conversations, listings, messages, notifications } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, rateLimit, requireUser } from "@/lib/api";
import { newId } from "@/lib/ids";
import { SAFETY_NOTICE } from "@/lib/constants";

const schema = z.object({
  listingId: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
  intent: z.enum(["QUESTION", "VIEWING", "INSPECTION"]).default("QUESTION"),
  appointmentAt: z.string().datetime().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    rateLimit(`inquiry:${ctx.user.id}`, 20, 60 * 60 * 1000);
    const body = await parseBody(req, schema);

    const rows = await db.select().from(listings).where(eq(listings.id, body.listingId)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");
    if (listing.sellerId === ctx.user.id) throw new ApiError(400, "OWN_LISTING", "This is your own listing.");
    if (listing.status === "SOLD" || listing.status === "ARCHIVED") {
      throw new ApiError(409, "NOT_AVAILABLE", "This car is no longer available.");
    }

    const existing = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.listingId, listing.id),
          eq(conversations.buyerId, ctx.user.id),
          eq(conversations.sellerId, listing.sellerId),
        ),
      )
      .limit(1);

    let conversationId = existing[0]?.id;
    if (!conversationId) {
      conversationId = newId("cnv");
      await db.insert(conversations).values({
        id: conversationId,
        listingId: listing.id,
        buyerId: ctx.user.id,
        sellerId: listing.sellerId,
        tenantId: listing.tenantId,
        subject: `Inquiry: ${listing.slug}`,
        status: "OPEN",
      });
      await db.insert(messages).values({
        id: newId("msg"),
        conversationId,
        senderId: listing.sellerId,
        body: SAFETY_NOTICE,
        kind: "SAFETY_NOTICE",
      });
    }

    const messageId = newId("msg");
    await db.insert(messages).values({ id: messageId, conversationId, senderId: ctx.user.id, body: body.message });
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
    await db.update(listings).set({ contactCount: listing.contactCount + 1 }).where(eq(listings.id, listing.id));

    let appointmentId: string | null = null;
    if (body.intent === "VIEWING" && body.appointmentAt) {
      const when = new Date(body.appointmentAt);
      if (Number.isNaN(when.getTime())) throw new ApiError(422, "INVALID_DATE", "Invalid appointment time.");
      if (when.getTime() < Date.now()) throw new ApiError(422, "PAST_DATE", "Choose a future date and time.");
      appointmentId = newId("apt");
      await db.insert(appointments).values({
        id: appointmentId,
        listingId: listing.id,
        buyerId: ctx.user.id,
        sellerId: listing.sellerId,
        tenantId: listing.tenantId,
        preferredAt: when,
        note: body.message.slice(0, 500),
        status: "REQUESTED",
      });
    }

    await db.insert(notifications).values({
      id: newId("ntf"),
      userId: listing.sellerId,
      type: body.intent === "VIEWING" ? "APPOINTMENT" : "INQUIRY",
      titleKey: body.intent === "VIEWING" ? "notifications.appointment" : "notifications.newInquiry",
      dataJson: JSON.stringify({ car: listing.slug }),
      link: `/messages/${conversationId}`,
    });

    await audit({
      actorId: ctx.user.id,
      tenantId: listing.tenantId,
      action: body.intent === "VIEWING" ? "appointment.request" : "inquiry.create",
      targetType: "listing",
      targetId: listing.id,
      metadata: { conversationId, appointmentId },
    });

    return jsonOk({ conversationId, appointmentId }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
