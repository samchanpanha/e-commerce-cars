import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Gauge,
  GitCompareArrows,
  MapPin,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react";
import { db } from "@/db";
import { favorites, listings as listingsTable } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { getListingBySlug, incrementView, searchListings, EMPTY_FILTERS } from "@/lib/listings";
import { getLatestReportForVehicle } from "@/lib/reports";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatMileage, formatPricePair, timeAgo } from "@/lib/money";
import { getT } from "@/i18n";
import { Gallery } from "@/components/listing/gallery";
import { ContactSeller } from "@/components/listing/contact-seller";
import { ReportRequest } from "@/components/listing/report-request";
import { CompareButton } from "@/components/listing/compare";
import { CompareBar } from "@/components/listing/compare";
import { FavoriteButton } from "@/components/listing/favorite-button";
import { CarCard } from "@/components/listing/car-card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ReportListingButton } from "@/components/listing/report-listing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getListingBySlug(slug);
  if (!data) return { title: "Car not found" };
  const v = data.vehicle;
  return {
    title: `${v.year} ${v.make} ${v.model} — $${data.listing.priceUsd.toLocaleString("en-US")}`,
    description: data.listing.descriptionEn.slice(0, 155),
    openGraph: {
      title: `${v.year} ${v.make} ${v.model}`,
      description: data.listing.descriptionEn.slice(0, 155),
      images: data.images[0]?.url ? [data.images[0].url] : undefined,
    },
  };
}

export default async function ListingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const [{ lang, t }, ctx, data] = await Promise.all([getT(), getAuthContext(), getListingBySlug(slug)]);

  if (!data) notFound();

  const isOwnerOrStaff =
    ctx.user &&
    (data.listing.sellerId === ctx.user.id ||
      ctx.isPlatformAdmin ||
      (data.listing.tenantId ? ctx.memberships.some((m) => m.tenantId === data.listing.tenantId) : false));

  if (data.tenant && data.tenant.status !== "ACTIVE" && !isOwnerOrStaff) notFound();

  if (data.listing.status !== "PUBLISHED" && !isOwnerOrStaff) {
    notFound();
  }

  await incrementView(data.listing.id);

  const [existingReport, isFavorite, similar] = await Promise.all([
    getLatestReportForVehicle(data.vehicle.id),
    ctx.user
      ? db
          .select({ id: favorites.id })
          .from(favorites)
          .where(and(eq(favorites.userId, ctx.user.id), eq(favorites.listingId, data.listing.id)))
          .limit(1)
      : Promise.resolve([]),
    searchListings({ ...EMPTY_FILTERS, make: data.vehicle.make, sort: "newest", pageSize: 4 }),
  ]);

  const viewingReportId =
    existingReport && ctx.user && existingReport.requestedById === ctx.user.id
      ? existingReport.publicId
      : null;

  const v = data.vehicle;
  const l = data.listing;
  const title = `${v.year} ${v.make} ${v.model}${v.variant ? ` ${v.variant}` : ""}`;
  const sellerName = data.tenant?.name ?? data.seller.name;
  const similarCars = similar.items.filter((c) => c.id !== l.id).slice(0, 3);
  const reported = sp.reported === "1";

  const specRows = [
    { label: t("common.year"), value: String(v.year) },
    { label: t("common.mileage"), value: formatMileage(v.mileageKm, lang) },
    { label: t("common.transmission"), value: t(`common.${v.transmission.toLowerCase()}` as Parameters<typeof t>[0]) },
    { label: t("common.fuel"), value: t(`common.${v.fuelType.toLowerCase()}` as Parameters<typeof t>[0]) },
    { label: t("common.body"), value: t(`common.${v.bodyType.toLowerCase()}` as Parameters<typeof t>[0]) },
    { label: t("listing.spec.engine"), value: v.engineCc ? `${v.engineCc} cc` : t("listing.spec.notProvided") },
    { label: t("listing.spec.drivetrain"), value: v.drivetrain ?? t("listing.spec.notProvided") },
    { label: t("listing.spec.seats"), value: v.seats ? String(v.seats) : t("listing.spec.notProvided") },
    { label: t("listing.spec.color"), value: v.exteriorColor || t("listing.spec.notProvided") },
    { label: t("listing.spec.regYear"), value: v.registrationYear ? String(v.registrationYear) : t("listing.spec.notProvided") },
    { label: t("listing.spec.vin"), value: v.vin ? maskVin(v.vin) : t("listing.spec.notProvided") },
    { label: t("listing.spec.plate"), value: v.plateNumber ? maskPlate(v.plateNumber) : t("listing.spec.notProvided") },
    { label: t("listing.spec.import"), value: v.importCountry || t("listing.spec.notProvided") },
    { label: t("listing.spec.condition"), value: l.condition === "USED" ? (lang === "km" ? "ប្រើប្រាស់" : "Used") : l.condition },
  ];

  return (
    <div className="container-wide py-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-ink-500">
        <Link href="/" className="no-underline hover:text-brand-800">Home</Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <Link href="/cars" className="no-underline hover:text-brand-800">{t("nav.browse")}</Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="truncate text-ink-700">{title}</span>
      </nav>

      {reported ? (
        <Alert tone="success" className="mt-4" title={t("listing.reported")}>
          {lang === "km" ? "ក្រុមការងារយើងនឹងពិនិត្យការផ្សាយនេះ។" : "Our moderation team will review this listing."}
        </Alert>
      ) : null}

      {l.status !== "PUBLISHED" ? (
        <Alert tone="warning" className="mt-4" title={`Status: ${l.status}`}>
          This listing is not visible to the public. You are seeing it because you own or manage it.
        </Alert>
      ) : null}

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {l.featuredUntil && l.featuredUntil > new Date() ? <Badge tone="gold">Featured</Badge> : null}
            {data.tenant?.verificationStatus === "VERIFIED" ? (
              <Badge tone="ok" icon={<BadgeCheck className="h-3 w-3" />}>{t("listing.sellerVerified")}</Badge>
            ) : data.tenant ? (
              <Badge tone="slate">{t("listing.sellerNotVerified")}</Badge>
            ) : (
              <Badge tone="slate">{t("listing.sellerPrivateBadge")}</Badge>
            )}
            {l.status === "SOLD" ? <Badge tone="danger">{t("listing.sold")}</Badge> : null}
            {l.inspectionAvailable ? <Badge tone="brand" icon={<ShieldCheck className="h-3 w-3" />}>{t("card.inspection")}</Badge> : null}
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-ink-950 sm:text-3xl">{title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden />{l.district ? `${l.district}, ` : ""}{l.province}</span>
            <span aria-hidden>·</span>
            <span>{l.viewCount.toLocaleString("en-US")} {t("listing.viewCount")}</span>
            <span aria-hidden>·</span>
            <span>{l.publishedAt ? timeAgo(l.publishedAt, lang) : ""}</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">{formatPricePair(l.priceUsd, lang)}</p>
          <p className="mt-0.5 text-xs text-ink-500">{l.negotiable ? t("listing.price.negotiable") : t("listing.price.fixed")}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-7">
          <Gallery images={data.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))} title={title} />

          <section aria-labelledby="specs-heading" className="card p-5 sm:p-6">
            <h2 id="specs-heading" className="text-lg font-bold text-ink-950">{t("listing.specs")}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {specRows.map((row) => (
                <div key={row.label} className="min-w-0 border-b border-ink-100 pb-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{row.label}</dt>
                  <dd className="mt-0.5 truncate text-sm font-medium text-ink-900">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-ink-50 p-3 text-[11px] leading-relaxed text-ink-500">
              <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {lang === "km"
                ? "VIN និងស្លាកលេខត្រូវបានបិទមួយផ្នែក។ អ្នកទិញដែលបានផ្ទៀងផ្ទាត់ និងស្នើរបាយការណ៍អាចមើលឃើញពេញលេញក្នុងរបាយការណ៍។"
                : "VIN and plate are partially masked. Buyers who request a report see the identifiers that were checked."}
            </p>
          </section>

          <section aria-labelledby="desc-heading" className="card p-5 sm:p-6">
            <h2 id="desc-heading" className="text-lg font-bold text-ink-950">{t("listing.description")}</h2>
            <div className="prose-copy mt-3 whitespace-pre-line" lang={lang === "km" && l.descriptionKm ? "km" : "en"}>
              {(lang === "km" && l.descriptionKm) || l.descriptionEn}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
              {v.accidentClaim ? (
                <span className="chip chip-slate">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  {lang === "km" ? "ប្រវត្តិគ្រោះថ្នាក់៖ " : "Accident statement: "}
                  {t(`listingForm.accident.${v.accidentClaim}` as Parameters<typeof t>[0])}
                </span>
              ) : null}
              {v.maintenanceClaim ? (
                <span className="chip chip-slate">
                  {lang === "km" ? "ថែទាំ៖ " : "Maintenance: "}
                  {t(`listingForm.maintenance.${v.maintenanceClaim}` as Parameters<typeof t>[0])}
                </span>
              ) : null}
              <span className="chip chip-slate">{t("common.unverified")} — seller claim</span>
            </div>
          </section>

          <section aria-labelledby="docs-heading" className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="docs-heading" className="text-lg font-bold text-ink-950">{t("listing.documents")}</h2>
                <p className="mt-1 text-xs text-ink-500">{t("listing.documentsBody")}</p>
              </div>
              <FileText className="h-5 w-5 shrink-0 text-ink-400" aria-hidden />
            </div>

            {data.docs.length ? (
              <table className="table-base mt-4">
                <thead>
                  <tr>
                    <th>{t("listing.doc.type")}</th>
                    <th>{t("listing.doc.status")}</th>
                    <th className="hidden sm:table-cell">{t("listing.doc.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.docs.map((doc) => (
                    <tr key={doc.id}>
                      <td>{DOCUMENT_TYPE_LABELS[doc.type]?.[lang] ?? doc.type}</td>
                      <td>
                        <Badge tone={doc.status === "VERIFIED" ? "ok" : doc.status === "REJECTED" ? "danger" : "warn"}>
                          {doc.status === "VERIFIED" ? t("common.verified") : doc.status === "REJECTED" ? "Rejected" : "Pending review"}
                        </Badge>
                      </td>
                      <td className="hidden text-xs text-ink-500 sm:table-cell">{formatDate(doc.verifiedAt, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-500">{t("listing.noDocuments")}</p>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <DocumentStatus
                label={t("listingForm.ownership")}
                value={t(`listingForm.ownership.${l.ownershipDocStatus}` as Parameters<typeof t>[0])}
                ok={l.ownershipDocStatus === "ORIGINAL_AVAILABLE"}
              />
              <DocumentStatus
                label={t("listingForm.importDoc")}
                value={t(`listingForm.importDoc.${l.importDocStatus}` as Parameters<typeof t>[0])}
                ok={l.importDocStatus === "AVAILABLE"}
              />
            </div>
          </section>

          <section aria-labelledby="safety-heading" className="rounded-2xl border border-gold-300/50 bg-gold-100/40 p-5 sm:p-6">
            <h2 id="safety-heading" className="flex items-center gap-2 text-base font-bold text-ink-950">
              <ShieldCheck className="h-5 w-5 text-gold-600" aria-hidden /> {t("listing.safety.title")}
            </h2>
            <ul className="mt-3 space-y-2">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex items-start gap-2 text-sm text-ink-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                  {t(`listing.safety.${n}` as Parameters<typeof t>[0])}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-500">
              {lang === "km"
                ? "AngkorEV មិនកាន់ប្រាក់អ្នកទិញ ហើយមិនដែលសុំការទូទាត់តាមសារទេ។"
                : "AngkorEV does not hold buyer funds and never requests payment through chat."}
            </p>
          </section>
        </div>

        {/* ---------------------------------------------------------- sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold text-ink-950">{formatPricePair(l.priceUsd, lang)}</p>
              <span className="text-xs text-ink-500">{l.negotiable ? t("listing.price.negotiable") : t("listing.price.fixed")}</span>
            </div>

            <div className="mt-4 space-y-2">
              <ContactSeller listingId={l.id} priceUsd={l.priceUsd} isAuthed={Boolean(ctx.user)} sellerName={sellerName} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-ink-100 pt-4">
              <CompareButton listingId={l.id} />
              <FavoriteButton listingId={l.id} initial={isFavorite.length > 0} withLabel />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-800">
                <Store className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-950">{sellerName}</p>
                <p className="text-xs text-ink-500">
                  {data.tenant ? `${t("common.dealer")} · ${data.tenant.province}` : t("common.private seller")}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-ink-600">
              {data.tenant?.verificationStatus === "VERIFIED" ? (
                <p className="flex items-center gap-1.5 text-brand-700">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {t("dealer.verification.VERIFIED")}
                </p>
              ) : null}
              <p className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                {t("listing.memberSince")} {formatDate(data.seller.createdAt, lang)}
              </p>
              {data.seller.phoneVerifiedAt ? (
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-ok-600" aria-hidden />
                  {lang === "km" ? "លេខទូរស័ព្ទផ្ទៀងផ្ទាត់" : "Phone verified"}
                </p>
              ) : null}
            </div>
            {data.tenant ? (
              <Link href={`/dealers/${data.tenant.slug}`} className="btn btn-secondary btn-sm mt-3 w-full no-underline">
                {t("dealer.inventory")} →
              </Link>
            ) : null}
            <p className="mt-3 border-t border-ink-100 pt-3 text-[11px] leading-relaxed text-ink-400">
              {t("listing.responseNote")}
            </p>
          </div>

          <div className="card border-brand-100 bg-brand-50/50 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-brand-900">
                <Gauge className="h-4 w-4" aria-hidden /> {t("listing.report.title")}
              </h2>
              <Badge tone="brand">{lang === "km" ? "ឥតគិតថ្លៃ" : "Free"}</Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-600">{t("listing.report.body")}</p>
            <div className="mt-3">
              <ReportRequest listingId={l.id} isAuthed={Boolean(ctx.user)} existingPublicId={viewingReportId} />
            </div>
          </div>

          <div className="px-1">
            <ReportListingButton listingId={l.id} isAuthed={Boolean(ctx.user)} />
          </div>
        </aside>
      </div>

      {similarCars.length ? (
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold text-ink-950">{t("listing.similar")}</h2>
            <Link href={`/cars?make=${encodeURIComponent(v.make)}`} className="text-sm font-semibold text-brand-700 no-underline hover:underline">
              {t("common.viewAll")} →
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similarCars.map((car) => (
              <CarCard key={car.id} car={car} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}

      <CompareBar />
    </div>
  );
}

function DocumentStatus({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-ink-200 px-3 py-2">
      <span className="text-xs text-ink-500">{label}</span>
      <span className={`flex items-center gap-1 text-xs font-semibold ${ok ? "text-ok-700" : "text-ink-600"}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <XCircle className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
        {value}
      </span>
    </div>
  );
}

/** Privacy: never render a full VIN or plate on a public page. */
function maskVin(vin: string): string {
  if (vin.length < 8) return "•••";
  return `${vin.slice(0, 4)}••••••${vin.slice(-4)}`;
}
function maskPlate(plate: string): string {
  if (plate.length < 4) return "•••";
  return `${plate.slice(0, 2)}•${plate.slice(-2)}`;
}
