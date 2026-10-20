import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, tenants, vehicleImages, vehicles } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, pageMeta, parseBody, parsePagination, requireUser } from "@/lib/api";
import { newId } from "@/lib/ids";
import { EMPTY_FILTERS, computeModerationFlags, detectDuplicates, marketMedian, parseSearchParams, searchListings, uniqueSlug, validProvince } from "@/lib/listings";
import { listingSchema } from "@/lib/validation";
import { canInTenant, resolveTenantForRequest } from "@/lib/rbac";
import { KHR_PER_USD } from "@/lib/constants";
import { usdToKhr } from "@/lib/money";

/** Public search API — same filters as the UI, useful for mobile clients. */
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const url = new URLSearchParams(params);
    const filters = parseSearchParams(url);
    const { limit } = parsePagination(url, filters.pageSize);
    const { items, total } = await searchListings({ ...filters, pageSize: limit });
    return jsonOk({ items, pagination: pageMeta(total, filters.page, filters.pageSize), filters });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    const body = await parseBody(req, listingSchema);

    if (!validProvince(body.province)) throw new ApiError(422, "INVALID_PROVINCE", "Unknown province.");
    if (body.publish && body.images.length === 0) {
      throw new ApiError(422, "PHOTOS_REQUIRED", "Add at least one photo before submitting for review.");
    }

    const requestedTenantId = req.nextUrl.searchParams.get("tenantId");
    let tenantId: string | null = null;
    if (requestedTenantId) {
      // Tenant is derived from an authorized membership, never trusted from the body.
      tenantId = await resolveTenantForRequest(ctx, requestedTenantId);
      if (!tenantId) throw new ApiError(403, "TENANT_FORBIDDEN", "You are not a member of that dealership.");
      if (!canInTenant(ctx, tenantId, "listing:create")) {
        throw new ApiError(403, "FORBIDDEN", "Your role cannot create listings.");
      }
      const tenantRows = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      if (tenantRows[0]?.status !== "ACTIVE") throw new ApiError(403, "TENANT_SUSPENDED", "This dealership is suspended.");
    }

    const dup = await detectDuplicates({
      vin: body.vehicle.vin || null,
      plate: body.vehicle.plateNumber || null,
      sellerId: ctx.user.id,
      make: body.vehicle.make,
      model: body.vehicle.model,
      year: body.vehicle.year,
    });
    const market = await marketMedian(body.vehicle.make, body.vehicle.model, body.vehicle.year);
    const flags = computeModerationFlags({
      description: body.descriptionEn,
      priceUsd: body.priceUsd,
      imageCount: body.images.length,
      mileageKm: body.vehicle.mileageKm,
      year: body.vehicle.year,
      sellerCreatedAt: ctx.user.createdAt,
      duplicateVin: dup.duplicateVin,
      duplicatePlate: dup.duplicatePlate,
      similarListing: dup.similarListing,
      marketMedian: market.median,
    });

    const vehicleId = newId("veh");
    const listingId = newId("lst");
    const slug = await uniqueSlug(`${body.vehicle.year}-${body.vehicle.make}-${body.vehicle.model}`);

    await db.insert(vehicles).values({
      id: vehicleId,
      make: body.vehicle.make,
      model: body.vehicle.model,
      variant: body.vehicle.variant || null,
      year: body.vehicle.year,
      registrationYear: body.vehicle.registrationYear ?? null,
      mileageKm: body.vehicle.mileageKm,
      transmission: body.vehicle.transmission,
      fuelType: body.vehicle.fuelType,
      engineCc: body.vehicle.engineCc ?? null,
      drivetrain: body.vehicle.drivetrain ?? null,
      bodyType: body.vehicle.bodyType,
      exteriorColor: body.vehicle.exteriorColor || null,
      interiorColor: body.vehicle.interiorColor || null,
      seats: body.vehicle.seats ?? null,
      vin: body.vehicle.vin || null,
      chassisNumber: body.vehicle.chassisNumber || null,
      plateNumber: body.vehicle.plateNumber || null,
      importCountry: body.vehicle.importCountry || null,
      vinStatus: body.vehicle.vin ? "PROVIDED" : "MISSING",
      accidentClaim: body.vehicle.accidentClaim ?? "UNKNOWN",
      maintenanceClaim: body.vehicle.maintenanceClaim ?? "UNKNOWN",
    });

    const publishNow = body.publish;
    const status = publishNow ? "PENDING" : "DRAFT";

    await db.insert(listings).values({
      id: listingId,
      slug,
      vehicleId,
      sellerId: ctx.user.id,
      tenantId,
      priceUsd: body.priceUsd,
      priceKhr: usdToKhr(body.priceUsd, KHR_PER_USD),
      negotiable: body.negotiable,
      status,
      province: body.province,
      district: body.district || null,
      descriptionEn: body.descriptionEn,
      descriptionKm: body.descriptionKm || null,
      ownershipDocStatus: body.ownershipDocStatus,
      importDocStatus: body.importDocStatus,
      inspectionAvailable: body.inspectionAvailable,
      inspectionNote: body.inspectionNote || null,
      moderationFlags: JSON.stringify(flags),
      publishedAt: null,
      expiresAt: null,
    });

    if (body.images.length) {
      await db.insert(vehicleImages).values(
        body.images.map((img, index) => ({
          id: newId("img"),
          vehicleId,
          url: img.url,
          alt: img.alt ?? null,
          position: index,
          hash: img.hash ?? null,
        })),
      );
    }

    await audit({
      actorId: ctx.user.id,
      actorRole: ctx.user.platformRole,
      tenantId,
      action: publishNow ? "listing.submit" : "listing.create",
      targetType: "listing",
      targetId: listingId,
      metadata: { flags: flags.map((f) => f.code) },
    });

    return NextResponse.json(
      { data: { id: listingId, slug, status, flags, duplicates: dup } },
      { status: 201 },
    );
  } catch (err) {
    return jsonError(err);
  }
}
