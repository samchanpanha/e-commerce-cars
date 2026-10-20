import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { notifications, vehicleDocuments } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canPlatform } from "@/lib/rbac";
import { newId } from "@/lib/ids";

const schema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "PENDING"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    if (!canPlatform(ctx, "moderation:handle")) throw new ApiError(403, "FORBIDDEN", "Moderation access required.");

    const body = await parseBody(req, schema);
    const rows = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.id, id)).limit(1);
    const doc = rows[0];
    if (!doc) throw new ApiError(404, "NOT_FOUND", "Document not found.");

    await db
      .update(vehicleDocuments)
      .set({
        status: body.status,
        note: body.note ?? doc.note,
        verifiedById: body.status === "VERIFIED" ? ctx.user.id : null,
        verifiedAt: body.status === "VERIFIED" ? new Date() : null,
      })
      .where(eq(vehicleDocuments.id, id));

    if (doc.uploadedById) {
      await db.insert(notifications).values({
        id: newId("ntf"),
        userId: doc.uploadedById,
        type: "DOCUMENT_REVIEWED",
        titleKey: body.status === "VERIFIED" ? "notifications.docVerified" : "notifications.docRejected",
        dataJson: JSON.stringify({ documentId: id, type: doc.type }),
        link: "/seller",
      });
    }

    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: `document.${body.status.toLowerCase()}`, targetType: "vehicle_document", targetId: id, metadata: { note: body.note } });
    return jsonOk({ status: body.status });
  } catch (err) {
    return jsonError(err);
  }
}
