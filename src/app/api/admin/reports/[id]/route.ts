import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { reportRequests } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canPlatform } from "@/lib/rbac";
import { processReport, reviewReport } from "@/lib/reports";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("RERUN") }),
  z.object({ action: z.literal("APPROVE"), note: z.string().max(1000).optional() }),
  z.object({ action: z.literal("SEND_BACK"), note: z.string().max(1000).optional() }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    if (!canPlatform(ctx, "report:review")) throw new ApiError(403, "FORBIDDEN", "Report review access required.");

    const body = await parseBody(req, schema);
    const rows = await db.select().from(reportRequests).where(eq(reportRequests.id, id)).limit(1);
    const report = rows[0];
    if (!report) throw new ApiError(404, "NOT_FOUND", "Report not found.");

    if (body.action === "RERUN") {
      await processReport(id);
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "report.rerun", targetType: "report", targetId: id });
      const updated = await db.select({ status: reportRequests.status }).from(reportRequests).where(eq(reportRequests.id, id)).limit(1);
      return jsonOk({ status: updated[0]?.status });
    }

    await reviewReport({
      reportId: id,
      reviewerId: ctx.user.id,
      status: body.action === "APPROVE" ? "READY" : "NEEDS_REVIEW",
      note: body.note,
    });
    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: `report.${body.action.toLowerCase()}`, targetType: "report", targetId: id });
    return jsonOk({ status: body.action === "APPROVE" ? "READY" : "NEEDS_REVIEW" });
  } catch (err) {
    return jsonError(err);
  }
}
