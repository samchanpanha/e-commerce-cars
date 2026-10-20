import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { listings, vehicleDocuments, vehicleImages, vehicles } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { canAccessListing } from "@/lib/rbac";
import { getT } from "@/i18n";
import { ListingWizard, type WizardInitial } from "@/components/listing/listing-wizard";
import { DocumentUploader } from "@/components/listing/document-uploader";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) redirect(`/login?next=/seller/listings/${id}/edit`);

  const rows = await db
    .select({ listing: listings, vehicle: vehicles })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .where(eq(listings.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) notFound();
  if (!(await canAccessListing(ctx, row.listing, "listing:edit"))) notFound();

  const [images, docs] = await Promise.all([
    db.select().from(vehicleImages).where(eq(vehicleImages.vehicleId, row.vehicle.id)).orderBy(asc(vehicleImages.position)),
    db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, row.vehicle.id)),
  ]);

  const v = row.vehicle;
  const l = row.listing;
  const initial: WizardInitial = {
    id: l.id,
    status: l.status,
    vehicle: {
      make: v.make,
      model: v.model,
      variant: v.variant ?? "",
      year: v.year,
      registrationYear: v.registrationYear ?? "",
      mileageKm: v.mileageKm,
      transmission: v.transmission,
      fuelType: v.fuelType,
      engineCc: v.engineCc ?? "",
      drivetrain: v.drivetrain ?? "",
      bodyType: v.bodyType,
      exteriorColor: v.exteriorColor ?? "",
      interiorColor: v.interiorColor ?? "",
      seats: v.seats ?? "",
      vin: v.vin ?? "",
      chassisNumber: v.chassisNumber ?? "",
      plateNumber: v.plateNumber ?? "",
      importCountry: v.importCountry ?? "",
      accidentClaim: v.accidentClaim ?? "UNKNOWN",
      maintenanceClaim: v.maintenanceClaim ?? "UNKNOWN",
    },
    priceUsd: l.priceUsd,
    negotiable: l.negotiable,
    province: l.province,
    district: l.district ?? "",
    descriptionEn: l.descriptionEn,
    descriptionKm: l.descriptionKm ?? "",
    ownershipDocStatus: l.ownershipDocStatus,
    importDocStatus: l.importDocStatus,
    inspectionAvailable: l.inspectionAvailable,
    inspectionNote: l.inspectionNote ?? "",
    images: images.map((i) => ({ url: i.url, hash: i.hash ?? undefined })),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/seller" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 no-underline hover:text-brand-800">
        <ArrowLeft className="h-3.5 w-3.5" /> {t("seller.myListings")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-500">
          {t("common.status")}: <span className="font-semibold text-ink-800">{l.status}</span>
          {l.status === "PUBLISHED" ? <span> · {lang === "km" ? "ការកែសម្រួលត្រូវពិនិត្យឡើងវិញ" : "Edits are re-checked by moderation"}</span> : null}
        </p>
      </div>

      {l.status === "REJECTED" && l.rejectionReason ? (
        <Alert tone="danger" title={t("seller.rejectedReason")}>{l.rejectionReason}</Alert>
      ) : null}

      <ListingWizard initial={initial} mode="edit" tenantId={l.tenantId} />

      <DocumentUploader
        listingId={l.id}
        canUpload
        documents={docs.map((d) => ({ id: d.id, type: d.type, status: d.status, fileName: d.fileName, uploadedAt: d.uploadedAt }))}
      />
    </div>
  );
}
