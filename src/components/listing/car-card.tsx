import Link from "next/link";
import { BadgeCheck, Camera, CarFront, FileCheck2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { translate, type Lang } from "@/i18n/dictionary";
import { formatPricePair, timeAgo } from "@/lib/money";
import type { ListingCard } from "@/lib/listings";

export function CarCard({ car, lang }: { car: ListingCard; lang: Lang }) {
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(lang, key, vars);
  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const sellerLabel = car.sellerType === "dealer" ? car.tenantName ?? t("common.dealer") : t("common.private seller");

  return (
    <article className="card card-hover group overflow-hidden">
      <Link href={`/cars/${car.slug}`} className="block no-underline">
        <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
          {car.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={car.image}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-ink-400">
              <CarFront className="h-10 w-10" aria-hidden />
            </div>
          )}

          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {car.featured ? (
              <span className="chip chip-gold shadow-sm">
                <Sparkles className="h-3 w-3" aria-hidden /> {t("search.featured")}
              </span>
            ) : null}
            {car.hasVerifiedDoc ? (
              <span className="chip chip-ok shadow-sm">
                <FileCheck2 className="h-3 w-3" aria-hidden /> {t("card.docVerified")}
              </span>
            ) : null}
          </div>

          {car.imageCount > 1 ? (
            <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-ink-950/70 px-1.5 py-1 text-[11px] font-semibold text-white">
              <Camera className="h-3 w-3" aria-hidden /> {car.imageCount}
            </span>
          ) : null}
        </div>

        <div className="space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-ink-950">{title}</h3>
              <p className="mt-0.5 truncate text-xs text-ink-500">
                {t(`common.${car.bodyType.toLowerCase()}` as Parameters<typeof t>[0])} · {t(`common.${car.transmission.toLowerCase()}` as Parameters<typeof t>[0])}
              </p>
            </div>
            <p className="shrink-0 text-right text-[15px] font-bold text-ink-950">
              {formatPricePair(car.priceUsd, lang)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span>{car.year}</span>
            <span aria-hidden>·</span>
            <span>
              {car.mileageKm.toLocaleString("en-US")} {t("common.km")}
            </span>
            <span aria-hidden>·</span>
            <span>{t(`common.${car.fuelType.toLowerCase()}` as Parameters<typeof t>[0])}</span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-ink-100 pt-2.5">
            <span className="flex min-w-0 items-center gap-1 text-xs text-ink-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{car.province}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink-700">
              {car.tenantVerified ? <BadgeCheck className="h-3.5 w-3.5 text-brand-700" aria-hidden /> : <ShieldCheck className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
              <span className="max-w-32 truncate">{sellerLabel}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-ink-400">
            <span className="flex items-center gap-1">
              {car.inspectionAvailable ? (
                <span className="inline-flex items-center gap-1 text-brand-700">
                  <ShieldCheck className="h-3 w-3" aria-hidden /> {t("card.inspection")}
                </span>
              ) : (
                <span>{car.ownershipDocStatus === "ORIGINAL_AVAILABLE" ? t("listingForm.ownership.ORIGINAL_AVAILABLE") : ""}</span>
              )}
            </span>
            <span>{car.publishedAt ? timeAgo(car.publishedAt, lang) : ""}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-5 w-1/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}
