import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { notifications, reportedContent } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canPlatform } from "@/lib/rbac";
import { newId } from "@/lib/ids";

const schema = z.object({
  action: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]),
  note: z.string().trim().max(1000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    if (!canPlatform(ctx, "moderation:handle")) throw new ApiError(403, "FORBIDDEN", "Moderation access required.");

    const body = await parseBody(req, schema);
    const rows = await db.select().from(reportedContent).where(eq(reportedContent.id, id)).limit(1);
    const item = rows[0];
    if (!item) throw new ApiError(404, "NOT_FOUND", "Case not found.");

    await db
      .update(reportedContent)
      .set({
        status: body.action,
        handledById: ctx.user.id,
        handledAt: body.action === "REVIEWING" ? null : new Date(),
        resolutionNote: body.note ?? item.resolutionNote,
      })
      .where(eq(reportedContent.id, id));

    if (body.action !== "REVIEWING") {
      await db.insert(notifications).values({
        id: newId("ntf"),
        userId: item.reporterId,
        type: "CASE_RESOLVED",
        titleKey: "notifications.caseResolved",
        dataJson: JSON.stringify({ caseId: id }),
        link: "/dashboard/notifications",
      });
    }

    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: `case.${body.action.toLowerCase()}`, targetType: "reported_content", targetId: id });
    return jsonOk({ status: body.action });
  } catch (err) {
    return jsonError(err);
  }
}
