import { NextResponse, type NextRequest } from "next/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { listings, reportFindings, reportRequests, tenants, users, vehicleImages, vehicles } from "@/db/schema";
import { MAX_COMPARE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Public comparison payload. Only published listings are returned, and vehicle
 * documents are never included — only the aggregate report status.
 */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);

  if (ids.length === 0) {
    return NextResponse.json({ data: { items: [] } });
  }

  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      priceUsd: listings.priceUsd,
      priceKhr: listings.priceKhr,
      listingStatus: listings.status,
      condition: listings.condition,
      province: listings.province,
      sellerId: listings.sellerId,
      tenantName: tenants.name,
      tenantVerified: tenants.verificationStatus,
      inspectionAvailable: listings.inspectionAvailable,
      ownershipDocStatus: listings.ownershipDocStatus,
      vehicleId: vehicles.id,
      make: vehicles.make,
      model: vehicles.model,
      variant: vehicles.variant,
      year: vehicles.year,
      mileageKm: vehicles.mileageKm,
      transmission: vehicles.transmission,
      fuelType: vehicles.fuelType,
      engineCc: vehicles.engineCc,
      drivetrain: vehicles.drivetrain,
      bodyType: vehicles.bodyType,
      exteriorColor: vehicles.exteriorColor,
      seats: vehicles.seats,
      vinStatus: vehicles.vinStatus,
      sellerName: users.name,
    })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .innerJoin(users, eq(users.id, listings.sellerId))
    .leftJoin(tenants, eq(tenants.id, listings.tenantId))
    .where(inArray(listings.id, ids));

  const published = rows.filter((row) => row.listingStatus === "PUBLISHED");
  const vehicleIds = published.map((row) => row.vehicleId);

  const images = vehicleIds.length
    ? await db
        .select({ vehicleId: vehicleImages.vehicleId, url: vehicleImages.url })
        .from(vehicleImages)
        .where(inArray(vehicleImages.vehicleId, vehicleIds))
        .orderBy(asc(vehicleImages.position))
    : [];
  const firstImage = new Map<string, string>();
  for (const image of images) if (!firstImage.has(image.vehicleId)) firstImage.set(image.vehicleId, image.url);

  const reports = vehicleIds.length
    ? await db
        .select({
          id: reportRequests.id,
          publicId: reportRequests.publicId,
          vehicleId: reportRequests.vehicleId,
          status: reportRequests.status,
          confidence: reportRequests.confidence,
          riskLevel: reportRequests.riskLevel,
          requestedAt: reportRequests.requestedAt,
        })
        .from(reportRequests)
        .where(inArray(reportRequests.vehicleId, vehicleIds))
        .orderBy(desc(reportRequests.requestedAt))
    : [];

  const latestReport = new Map<string, (typeof reports)[number]>();
  for (const report of reports) {
    if (report.status !== "READY" && report.status !== "NEEDS_REVIEW") continue;
    if (!latestReport.has(report.vehicleId)) latestReport.set(report.vehicleId, report);
  }

  const reportIds = [...latestReport.values()].map((report) => report.id);
  const findingRows = reportIds.length
    ? await db
        .select({ reportId: reportFindings.reportId, status: reportFindings.status })
        .from(reportFindings)
        .where(inArray(reportFindings.reportId, reportIds))
    : [];
  const countsByReport = new Map<string, Record<string, number>>();
  for (const finding of findingRows) {
    const counts = countsByReport.get(finding.reportId) ?? {};
    counts[finding.status] = (counts[finding.status] ?? 0) + 1;
    countsByReport.set(finding.reportId, counts);
  }

  const byId = new Map(published.map((row) => [row.id, row]));
  const items = ids
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => {
      const report = latestReport.get(row.vehicleId);
      const counts = report ? countsByReport.get(report.id) ?? {} : {};
      return {
        id: row.id,
        slug: row.slug,
        name: `${row.year} ${row.make} ${row.model}${row.variant ? ` ${row.variant}` : ""}`,
        priceUsd: row.priceUsd,
        priceKhr: row.priceKhr,
        condition: row.condition,
        province: row.province,
        image: firstImage.get(row.vehicleId) ?? null,
        year: row.year,
        mileageKm: row.mileageKm,
        transmission: row.transmission,
        fuelType: row.fuelType,
        engineCc: row.engineCc,
        drivetrain: row.drivetrain,
        bodyType: row.bodyType,
        exteriorColor: row.exteriorColor,
        seats: row.seats,
        vinStatus: row.vinStatus,
        inspectionAvailable: row.inspectionAvailable,
        ownershipDocStatus: row.ownershipDocStatus,
        sellerName: row.sellerName,
        tenantName: row.tenantName,
        tenantVerified: row.tenantVerified === "VERIFIED",
        sellerType: row.tenantName ? "dealer" : "private",
        report: report
          ? {
              publicId: report.publicId,
              status: report.status,
              confidence: report.confidence,
              riskLevel: report.riskLevel,
              counts: {
                verified: counts.VERIFIED_BY_SOURCE ?? 0,
                evidence: counts.EVIDENCE_FOUND ?? 0,
                inconsistency: counts.POTENTIAL_INCONSISTENCY ?? 0,
                notVerified: counts.NOT_VERIFIED ?? 0,
                noData: counts.NO_DATA ?? 0,
              },
            }
          : null,
      };
    });

  return NextResponse.json({ data: { items } });
}
