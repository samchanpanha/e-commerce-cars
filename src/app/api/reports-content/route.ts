import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { listings, reportedContent } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, rateLimit, requireUser } from "@/lib/api";
import { newId } from "@/lib/ids";

const schema = z.object({
  targetType: z.enum(["LISTING", "USER", "MESSAGE", "REPORT"]),
  targetId: z.string().min(1),
  listingId: z.string().optional(),
  reason: z.enum(["INCORRECT_INFO", "HIDDEN_DAMAGE", "SUSPECTED_FRAUD", "DUPLICATE_LISTING", "SOLD_ELSEWHERE", "OTHER"]),
  details: z.string().trim().max(1500).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    rateLimit(`report-content:${ctx.user.id}`, 15, 60 * 60 * 1000);
    const body = await parseBody(req, schema);

    if (body.targetType === "LISTING") {
      const exists = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, body.targetId)).limit(1);
      if (!exists.length) throw new ApiError(404, "NOT_FOUND", "Listing not found.");
    }

    const id = newId("rptc");
    await db.insert(reportedContent).values({
      id,
      reporterId: ctx.user.id,
      targetType: body.targetType,
      targetId: body.targetId,
      listingId: body.listingId ?? (body.targetType === "LISTING" ? body.targetId : null),
      reason: body.reason,
      details: body.details || null,
      status: "OPEN",
    });

    await audit({ actorId: ctx.user.id, action: "moderation.report_content", targetType: body.targetType, targetId: body.targetId });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
