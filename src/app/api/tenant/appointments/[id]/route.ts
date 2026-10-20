import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { appointments, listings, notifications } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canInTenant } from "@/lib/rbac";
import { newId } from "@/lib/ids";

const schema = z.object({ status: z.enum(["CONFIRMED", "DECLINED", "COMPLETED", "CANCELLED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    const body = await parseBody(req, schema);

    const rows = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    const apt = rows[0];
    if (!apt) throw new ApiError(404, "NOT_FOUND", "Appointment not found.");

    const allowed = apt.tenantId
      ? canInTenant(ctx, apt.tenantId, "lead:manage")
      : apt.sellerId === ctx.user.id;
    if (!allowed) throw new ApiError(403, "FORBIDDEN", "You cannot update this appointment.");

    await db.update(appointments).set({ status: body.status, updatedAt: new Date() }).where(eq(appointments.id, id));

    const listingRows = await db.select({ slug: listings.slug }).from(listings).where(eq(listings.id, apt.listingId)).limit(1);
    await db.insert(notifications).values({
      id: newId("ntf"),
      userId: apt.buyerId,
      type: "APPOINTMENT_UPDATE",
      titleKey: "notifications.appointment",
      dataJson: JSON.stringify({ car: listingRows[0]?.slug ?? "a car", status: body.status }),
      link: "/customer",
    });

    await audit({ actorId: ctx.user.id, tenantId: apt.tenantId, action: `appointment.${body.status.toLowerCase()}`, targetType: "appointment", targetId: id });
    return jsonOk({ status: body.status });
  } catch (err) {
    return jsonError(err);
  }
}
