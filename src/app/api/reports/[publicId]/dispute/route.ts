import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { reportRequests, reportedContent } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canViewReport, getReportByPublicId } from "@/lib/reports";
import { newId } from "@/lib/ids";
import { reportSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    const ctx = await requireUser();
    const body = await parseBody(req, reportSchema);

    const record = await getReportByPublicId(publicId);
    if (!record) throw new ApiError(404, "NOT_FOUND", "Report not found.");

    const allowed = canViewReport(
      { userId: ctx.user.id, platformRole: ctx.user.platformRole, tenantIds: ctx.memberships.map((m) => m.tenantId) },
      { report: { requestedById: record.report.requestedById }, listing: record.listing ? { sellerId: record.listing.sellerId, tenantId: record.listing.tenantId } : null },
    );
    if (!allowed) throw new ApiError(403, "FORBIDDEN", "You cannot dispute this report.");

    const caseId = newId("rpc");
    await db.insert(reportedContent).values({
      id: caseId,
      reporterId: ctx.user.id,
      targetType: "REPORT",
      targetId: record.report.id,
      listingId: record.report.listingId,
      reason: body.reason,
      details: body.details || null,
      status: "OPEN",
    });

    // A disputed report drops out of "READY" until a human confirms it.
    if (record.report.status === "READY") {
      await db.update(reportRequests).set({ status: "NEEDS_REVIEW" }).where(eq(reportRequests.id, record.report.id));
    }

    await audit({ actorId: ctx.user.id, action: "report.dispute", targetType: "report", targetId: record.report.id, metadata: { caseId } });
    return jsonOk({ caseId }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
