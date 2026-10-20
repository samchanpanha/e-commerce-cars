import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { listings, vehicleImages, vehicles } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canAccessListing } from "@/lib/rbac";
import { listingUpdateSchema } from "@/lib/validation";
import { computeModerationFlags, detectDuplicates, marketMedian } from "@/lib/listings";
import { KHR_PER_USD } from "@/lib/constants";
import { usdToKhr } from "@/lib/money";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    const rows = await db
      .select({ listing: listings, vehicle: vehicles })
      .from(listings)
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(eq(listings.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) throw new ApiError(404, "NOT_FOUND", "Listing not found.");
    const allowed = await canAccessListing(ctx, row.listing, "listing:read");
    if (!allowed) throw new ApiError(403, "FORBIDDEN", "You do not have access to this listing.");
    const images = await db.select().from(vehicleImages).where(eq(vehicleImages.vehicleId, row.vehicle.id)).orderBy(asc(vehicleImages.position));
    return jsonOk({ ...row, images });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");

    const allowed = await canAccessListing(ctx, listing, "listing:edit");
    if (!allowed) throw new ApiError(403, "FORBIDDEN", "You cannot edit this listing.");
    if (listing.status === "SOLD") throw new ApiError(409, "LISTING_SOLD", "A sold listing cannot be edited.");

    const body = await parseBody(req, listingUpdateSchema);

    if (body.vehicle) {
      const v = body.vehicle;
      await db
        .update(vehicles)
        .set({
          ...(v.make !== undefined ? { make: v.make } : {}),
          ...(v.model !== undefined ? { model: v.model } : {}),
          ...(v.variant !== undefined ? { variant: v.variant || null } : {}),
          ...(v.year !== undefined ? { year: v.year } : {}),
          ...(v.registrationYear !== undefined ? { registrationYear: v.registrationYear ?? null } : {}),
          ...(v.mileageKm !== undefined ? { mileageKm: v.mileageKm } : {}),
          ...(v.transmission !== undefined ? { transmission: v.transmission } : {}),
          ...(v.fuelType !== undefined ? { fuelType: v.fuelType } : {}),
          ...(v.engineCc !== undefined ? { engineCc: v.engineCc ?? null } : {}),
          ...(v.drivetrain !== undefined ? { drivetrain: v.drivetrain ?? null } : {}),
          ...(v.bodyType !== undefined ? { bodyType: v.bodyType } : {}),
          ...(v.exteriorColor !== undefined ? { exteriorColor: v.exteriorColor || null } : {}),
          ...(v.seats !== undefined ? { seats: v.seats ?? null } : {}),
          ...(v.vin !== undefined ? { vin: v.vin || null, vinStatus: v.vin ? "PROVIDED" : "MISSING" } : {}),
          ...(v.chassisNumber !== undefined ? { chassisNumber: v.chassisNumber || null } : {}),
          ...(v.plateNumber !== undefined ? { plateNumber: v.plateNumber || null } : {}),
          ...(v.importCountry !== undefined ? { importCountry: v.importCountry || null } : {}),
          ...(v.accidentClaim !== undefined ? { accidentClaim: v.accidentClaim } : {}),
          ...(v.maintenanceClaim !== undefined ? { maintenanceClaim: v.maintenanceClaim } : {}),
          updatedAt: new Date(),
        })
        .where(eq(vehicles.id, listing.vehicleId));
    }

    if (body.images) {
      await db.delete(vehicleImages).where(eq(vehicleImages.vehicleId, listing.vehicleId));
      if (body.images.length) {
        await db.insert(vehicleImages).values(
          body.images.map((img, index) => ({
            id: `img_${listing.id}_${index}`,
            vehicleId: listing.vehicleId,
            url: img.url,
            alt: img.alt ?? null,
            position: index,
            hash: img.hash ?? null,
          })),
        );
      }
    }

    let moderationFlags = listing.moderationFlags;
    if (body.descriptionEn || body.priceUsd || body.vehicle) {
      const vehicleRows = await db.select().from(vehicles).where(eq(vehicles.id, listing.vehicleId)).limit(1);
      const v = vehicleRows[0];
      const imageCount = body.images?.length ?? (await db.select({ id: vehicleImages.id }).from(vehicleImages).where(eq(vehicleImages.vehicleId, listing.vehicleId))).length;
      const dup = await detectDuplicates({
        vehicleId: v.id,
        vin: v.vin,
        plate: v.plateNumber,
        sellerId: listing.sellerId,
        make: v.make,
        model: v.model,
        year: v.year,
      });
      const market = await marketMedian(v.make, v.model, v.year);
      const flags = computeModerationFlags({
        description: body.descriptionEn ?? listing.descriptionEn,
        priceUsd: body.priceUsd ?? listing.priceUsd,
        imageCount,
        mileageKm: v.mileageKm,
        year: v.year,
        sellerCreatedAt: ctx.user.createdAt,
        duplicateVin: dup.duplicateVin,
        duplicatePlate: dup.duplicatePlate,
        similarListing: dup.similarListing,
        marketMedian: market.median,
      });
      moderationFlags = JSON.stringify(flags);
    }

    const nextStatus =
      body.publish === true && listing.status === "DRAFT"
        ? "PENDING"
        : body.publish === true && listing.status === "REJECTED"
          ? "PENDING"
          : listing.status;

    await db
      .update(listings)
      .set({
        ...(body.priceUsd !== undefined ? { priceUsd: body.priceUsd, priceKhr: usdToKhr(body.priceUsd, KHR_PER_USD) } : {}),
        ...(body.negotiable !== undefined ? { negotiable: body.negotiable } : {}),
        ...(body.province !== undefined ? { province: body.province } : {}),
        ...(body.district !== undefined ? { district: body.district || null } : {}),
        ...(body.descriptionEn !== undefined ? { descriptionEn: body.descriptionEn } : {}),
        ...(body.descriptionKm !== undefined ? { descriptionKm: body.descriptionKm || null } : {}),
        ...(body.ownershipDocStatus !== undefined ? { ownershipDocStatus: body.ownershipDocStatus } : {}),
        ...(body.importDocStatus !== undefined ? { importDocStatus: body.importDocStatus } : {}),
        ...(body.inspectionAvailable !== undefined ? { inspectionAvailable: body.inspectionAvailable } : {}),
        ...(body.inspectionNote !== undefined ? { inspectionNote: body.inspectionNote || null } : {}),
        status: nextStatus,
        moderationFlags,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id));

    await audit({
      actorId: ctx.user.id,
      actorRole: ctx.user.platformRole,
      tenantId: listing.tenantId,
      action: "listing.update",
      targetType: "listing",
      targetId: id,
    });

    return jsonOk({ id, status: nextStatus });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");
    const allowed = await canAccessListing(ctx, listing, "listing:delete");
    if (!allowed) throw new ApiError(403, "FORBIDDEN", "You cannot delete this listing.");
    if (listing.status === "PUBLISHED") throw new ApiError(409, "PUBLISHED_LISTING", "Archive the listing before deleting it.");

    await db.delete(listings).where(eq(listings.id, id));
    await db.delete(vehicles).where(eq(vehicles.id, listing.vehicleId));
    await audit({
      actorId: ctx.user.id,
      actorRole: ctx.user.platformRole,
      tenantId: listing.tenantId,
      action: "listing.delete",
      targetType: "listing",
      targetId: id,
    });
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError(err);
  }
}
