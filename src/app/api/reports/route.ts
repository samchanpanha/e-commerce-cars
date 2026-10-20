import { and, eq, inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { listings, reportRequests } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, rateLimit, requireUser } from "@/lib/api";
import { createReportRequest } from "@/lib/reports";
import { reportRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    // Reports are expensive to produce; keep a firm per-user budget.
    rateLimit(`report:${ctx.user.id}`, 10, 24 * 60 * 60 * 1000);
    const body = await parseBody(req, reportRequestSchema);

    const rows = await db.select().from(listings).where(eq(listings.id, body.listingId ?? "")).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");

    // A buyer may generate their own report; the existing report is never shared.
    const existing = await db
      .select({ id: reportRequests.id, publicId: reportRequests.publicId })
      .from(reportRequests)
      .where(
        and(
          eq(reportRequests.vehicleId, listing.vehicleId),
          eq(reportRequests.requestedById, ctx.user.id),
          inArray(reportRequests.status, ["READY", "NEEDS_REVIEW", "PROCESSING", "QUEUED"]),
        ),
      )
      .limit(1);
    if (existing.length) {
      return jsonOk({ publicId: existing[0].publicId, reused: true });
    }

    const reportId = await createReportRequest({
      vehicleId: listing.vehicleId,
      listingId: listing.id,
      requestedById: ctx.user.id,
      autoProcess: true,
    });

    const created = await db.select({ publicId: reportRequests.publicId, status: reportRequests.status }).from(reportRequests).where(eq(reportRequests.id, reportId)).limit(1);

    await audit({ actorId: ctx.user.id, action: "report.request", targetType: "report", targetId: reportId, metadata: { listingId: listing.id } });

    return jsonOk({ publicId: created[0].publicId, status: created[0].status }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
