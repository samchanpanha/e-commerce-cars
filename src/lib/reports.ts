import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  listings,
  reportFindings,
  reportRequests,
  users,
  vehicleDocuments,
  vehicleImages,
  vehicles,
} from "@/db/schema";
import { newId, publicRef } from "./ids";
import { marketMedian } from "./listings";
import {
  analyzeVehicle,
  buildSummary,
  type AnalysisInput,
  type Finding,
} from "./report-engine";

export type ReportRecord = {
  report: typeof reportRequests.$inferSelect;
  findings: (typeof reportFindings.$inferSelect)[];
  vehicle: typeof vehicles.$inferSelect;
  listing: typeof listings.$inferSelect | null;
  requesterName: string | null;
};

async function gatherInput(vehicleId: string, listingId: string | null): Promise<{
  input: AnalysisInput;
  vehicle: typeof vehicles.$inferSelect;
  listing: typeof listings.$inferSelect | null;
}> {
  const vehicleRows = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  const vehicle = vehicleRows[0];
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");

  const listingRows = listingId
    ? await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)
    : await db.select().from(listings).where(eq(listings.vehicleId, vehicleId)).limit(1);
  const listing = listingRows[0] ?? null;

  const [docRows, imageRows] = await Promise.all([
    db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, vehicleId)),
    db.select().from(vehicleImages).where(eq(vehicleImages.vehicleId, vehicleId)),
  ]);

  // Duplicate identifiers across other active listings.
  const [dupVin, dupPlate] = await Promise.all([
    vehicle.vin
      ? db
          .select({ id: listings.id })
          .from(listings)
          .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
          .where(and(eq(vehicles.vin, vehicle.vin), ne(vehicles.id, vehicleId), inArray(listings.status, ["PUBLISHED", "PENDING"])))
          .limit(1)
      : Promise.resolve([]),
    vehicle.plateNumber
      ? db
          .select({ id: listings.id })
          .from(listings)
          .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
          .where(and(eq(vehicles.plateNumber, vehicle.plateNumber), ne(vehicles.id, vehicleId), inArray(listings.status, ["PUBLISHED", "PENDING"])))
          .limit(1)
      : Promise.resolve([]),
  ]);

  // Reused photos: same content hash on a different vehicle.
  const hashes = imageRows.map((i) => i.hash).filter((h): h is string => Boolean(h));
  let reusedPhotoCount = 0;
  if (hashes.length) {
    const reused = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicleImages)
      .where(and(inArray(vehicleImages.hash, hashes), ne(vehicleImages.vehicleId, vehicleId)));
    reusedPhotoCount = Number(reused[0]?.count ?? 0);
  }

  const market = await marketMedian(vehicle.make, vehicle.model, vehicle.year);

  const input: AnalysisInput = {
    vehicle: {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registrationYear: vehicle.registrationYear,
      mileageKm: vehicle.mileageKm,
      vin: vehicle.vin,
      chassisNumber: vehicle.chassisNumber,
      plateNumber: vehicle.plateNumber,
      importCountry: vehicle.importCountry,
      accidentClaim: vehicle.accidentClaim,
      maintenanceClaim: vehicle.maintenanceClaim,
    },
    listing: listing ? { priceUsd: listing.priceUsd, province: listing.province, inspectionAvailable: listing.inspectionAvailable } : null,
    documents: docRows.map((d) => ({
      id: d.id,
      type: d.type,
      status: d.status,
      verifiedAt: d.verifiedAt,
      extracted: d.extractedJson ? safeJson(d.extractedJson) : null,
    })),
    images: imageRows.map((i) => ({ id: i.id, hash: i.hash, width: i.width, height: i.height })),
    reusedPhotoCount,
    duplicateVinListingId: dupVin[0]?.id ?? null,
    duplicatePlateListingId: dupPlate[0]?.id ?? null,
    market,
    now: new Date(),
  };
  return { input, vehicle, listing };
}

function safeJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function createReportRequest(params: {
  vehicleId: string;
  listingId: string | null;
  requestedById: string | null;
  autoProcess?: boolean;
}): Promise<string> {
  const id = newId("rpt");
  const template = await db.select().from(vehicles).where(eq(vehicles.id, params.vehicleId)).limit(1);
  if (!template[0]) throw new Error("VEHICLE_NOT_FOUND");
  await db.insert(reportRequests).values({
    id,
    publicId: publicRef(),
    vehicleId: params.vehicleId,
    listingId: params.listingId,
    requestedById: params.requestedById,
    status: "QUEUED",
    requestedAt: new Date(),
  });
  if (params.autoProcess !== false) await processReport(id);
  return id;
}

/** Runs the analysis and persists findings. Idempotent: re-running replaces findings. */
export async function processReport(reportId: string): Promise<void> {
  const reportRows = await db.select().from(reportRequests).where(eq(reportRequests.id, reportId)).limit(1);
  const report = reportRows[0];
  if (!report) throw new Error("REPORT_NOT_FOUND");

  await db
    .update(reportRequests)
    .set({ status: "PROCESSING", startedAt: new Date() })
    .where(eq(reportRequests.id, reportId));

  try {
    const { input } = await gatherInput(report.vehicleId, report.listingId);
    const result = analyzeVehicle(input);
    const summary = buildSummary(result, "en");
    const summaryKm = buildSummary(result, "km");

    await db.delete(reportFindings).where(eq(reportFindings.reportId, reportId));
    if (result.findings.length) {
      await db.insert(reportFindings).values(
        result.findings.map((f: Finding, idx: number) => ({
          id: newId("rpf"),
          reportId,
          category: f.category,
          code: f.code,
          status: f.status,
          severity: f.severity,
          confidence: f.confidence,
          dataJson: JSON.stringify(f.data),
          sourceRef: f.sourceRef ?? null,
          sortOrder: idx,
        })),
      );
    }

    await db
      .update(reportRequests)
      .set({
        status: result.status,
        provider: result.provider,
        version: result.version,
        confidence: result.confidence,
        riskLevel: result.riskLevel,
        summaryEn: summary.summary,
        summaryKm: summaryKm.summary,
        limitationsEn: summary.limitations,
        limitationsKm: summaryKm.limitations,
        completedAt: new Date(),
      })
      .where(eq(reportRequests.id, reportId));
  } catch (err) {
    console.error("[report] processing failed", reportId, err);
    await db
      .update(reportRequests)
      .set({ status: "FAILED", completedAt: new Date() })
      .where(eq(reportRequests.id, reportId));
  }
}

export async function getReportByPublicId(publicId: string): Promise<ReportRecord | null> {
  const rows = await db
    .select({ report: reportRequests, vehicle: vehicles, listing: listings, requester: users.name })
    .from(reportRequests)
    .innerJoin(vehicles, eq(vehicles.id, reportRequests.vehicleId))
    .leftJoin(listings, eq(listings.id, reportRequests.listingId))
    .leftJoin(users, eq(users.id, reportRequests.requestedById))
    .where(eq(reportRequests.publicId, publicId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const findings = await db
    .select()
    .from(reportFindings)
    .where(eq(reportFindings.reportId, row.report.id))
    .orderBy(asc(reportFindings.sortOrder));
  return { report: row.report, findings, vehicle: row.vehicle, listing: row.listing, requesterName: row.requester };
}

export async function getLatestReportForVehicle(vehicleId: string) {
  const rows = await db
    .select()
    .from(reportRequests)
    .where(and(eq(reportRequests.vehicleId, vehicleId), inArray(reportRequests.status, ["READY", "NEEDS_REVIEW"])))
    .orderBy(desc(reportRequests.requestedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listReportsForUser(userId: string) {
  return db
    .select({
      publicId: reportRequests.publicId,
      status: reportRequests.status,
      riskLevel: reportRequests.riskLevel,
      confidence: reportRequests.confidence,
      requestedAt: reportRequests.requestedAt,
      completedAt: reportRequests.completedAt,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      listingSlug: listings.slug,
    })
    .from(reportRequests)
    .innerJoin(vehicles, eq(vehicles.id, reportRequests.vehicleId))
    .leftJoin(listings, eq(listings.id, reportRequests.listingId))
    .where(eq(reportRequests.requestedById, userId))
    .orderBy(desc(reportRequests.requestedAt))
    .limit(50);
}

/** Authorization: the requester, the seller of that vehicle, tenant staff, or platform staff. */
export function canViewReport(
  viewer: {
    userId: string | null;
    platformRole?: string | null;
    tenantIds?: string[];
  } | null,
  record: { report: { requestedById: string | null }; listing: { sellerId: string; tenantId: string | null } | null },
): boolean {
  if (!viewer?.userId) return false;
  if (viewer.platformRole === "SUPER_ADMIN" || viewer.platformRole === "PLATFORM_SUPPORT") return true;
  if (record.report.requestedById === viewer.userId) return true;
  if (record.listing) {
    if (record.listing.sellerId === viewer.userId) return true;
    if (record.listing.tenantId && viewer.tenantIds?.includes(record.listing.tenantId)) return true;
  }
  return false;
}

export async function listReportsForVehicle(vehicleId: string) {
  return db
    .select({
      publicId: reportRequests.publicId,
      status: reportRequests.status,
      riskLevel: reportRequests.riskLevel,
      confidence: reportRequests.confidence,
      requestedAt: reportRequests.requestedAt,
    })
    .from(reportRequests)
    .where(and(eq(reportRequests.vehicleId, vehicleId), inArray(reportRequests.status, ["READY", "NEEDS_REVIEW"])))
    .orderBy(desc(reportRequests.requestedAt))
    .limit(3);
}

export async function reviewReport(params: {
  reportId: string;
  reviewerId: string;
  status: "READY" | "NEEDS_REVIEW";
  note?: string;
}): Promise<void> {
  await db
    .update(reportRequests)
    .set({
      status: params.status,
      reviewedById: params.reviewerId,
      reviewedAt: new Date(),
      reviewerNote: params.note ?? null,
    })
    .where(eq(reportRequests.id, params.reportId));
}
