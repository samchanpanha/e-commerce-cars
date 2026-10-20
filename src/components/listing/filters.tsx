import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { BODY_TYPES, FUEL_TYPES, MAKES, PROVINCES, TRANSMISSIONS } from "@/lib/constants";
import { filtersToQueryString, type SearchFilters } from "@/lib/listings";
import { translate, type Lang } from "@/i18n/dictionary";

export function SearchFilters({ filters, lang, resultCount }: { filters: SearchFilters; lang: Lang; resultCount: number }) {
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);

  return (
    <form action="/cars" method="get" className="space-y-5">
      {/* Preserve sort when filtering */}
      {filters.sort !== "relevance" ? <input type="hidden" name="sort" value={filters.sort} /> : null}

      <div>
        <label htmlFor="f-q" className="label">{t("search.keyword")}</label>
        <input id="f-q" name="q" defaultValue={filters.q} className="input" placeholder={lang === "km" ? "ឧ. Prius" : "e.g. Prius"} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-make" className="label">{t("common.make")}</label>
          <select id="f-make" name="make" defaultValue={filters.make} className="select">
            <option value="">{t("common.all")}</option>
            {MAKES.map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-province" className="label">{t("search.province")}</label>
          <select id="f-province" name="province" defaultValue={filters.province} className="select">
            <option value="">{t("common.all")}</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="label">{t("common.price")} (USD)</span>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="minPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            defaultValue={filters.minPrice ?? ""}
            placeholder={lang === "km" ? "ពី" : "Min"}
            aria-label={t("search.minPrice")}
            className="input"
          />
          <input
            name="maxPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            defaultValue={filters.maxPrice ?? ""}
            placeholder={lang === "km" ? "ដល់" : "Max"}
            aria-label={t("search.maxPrice")}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-minYear" className="label">{t("search.minYear")}</label>
          <input id="f-minYear" name="minYear" type="number" inputMode="numeric" min={1980} max={2027} defaultValue={filters.minYear ?? ""} className="input" />
        </div>
        <div>
          <label htmlFor="f-maxYear" className="label">{t("search.maxYear")}</label>
          <input id="f-maxYear" name="maxYear" type="number" inputMode="numeric" min={1980} max={2027} defaultValue={filters.maxYear ?? ""} className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="f-mileage" className="label">{t("search.maxMileage")}</label>
        <input id="f-mileage" name="maxMileage" type="number" inputMode="numeric" min={0} step={5000} defaultValue={filters.maxMileage ?? ""} className="input" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-fuel" className="label">{t("common.fuel")}</label>
          <select id="f-fuel" name="fuel" defaultValue={filters.fuel} className="select">
            <option value="">{t("common.all")}</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>{t(`common.${f.toLowerCase()}` as Parameters<typeof t>[0])}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-trans" className="label">{t("common.transmission")}</label>
          <select id="f-trans" name="transmission" defaultValue={filters.transmission} className="select">
            <option value="">{t("common.all")}</option>
            {TRANSMISSIONS.map((tr) => (
              <option key={tr} value={tr}>{t(`common.${tr.toLowerCase()}` as Parameters<typeof t>[0])}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="f-body" className="label">{t("common.body")}</label>
        <select id="f-body" name="bodyType" defaultValue={filters.bodyType} className="select">
          <option value="">{t("common.all")}</option>
          {BODY_TYPES.map((b) => (
            <option key={b} value={b}>{t(`common.${b.toLowerCase()}` as Parameters<typeof t>[0])}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="label">{t("search.sellerType")}</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink-100 p-1">
          {[
            { value: "all", label: t("search.sellerAll") },
            { value: "dealer", label: t("search.sellerDealer") },
            { value: "private", label: t("search.sellerPrivate") },
          ].map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-lg px-2 py-1.5 text-center text-xs font-medium text-ink-600 has-[:checked]:bg-white has-[:checked]:text-ink-950 has-[:checked]:shadow-sm"
            >
              <input
                type="radio"
                name="sellerType"
                value={option.value}
                defaultChecked={filters.sellerType === option.value}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-200 p-3">
        <input
          type="checkbox"
          name="verifiedOnly"
          value="1"
          defaultChecked={filters.verifiedOnly}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-700 accent-brand-700"
        />
        <span className="text-xs leading-snug text-ink-700">{t("search.verifiedOnly")}</span>
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary flex-1">
          <SlidersHorizontal className="h-4 w-4" /> {t("common.apply")}
        </button>
        <Link href="/cars" className="btn btn-secondary">
          {t("common.reset")}
        </Link>
      </div>
      <p className="text-center text-xs text-ink-400">
        {resultCount} {lang === "km" ? "លទ្ធផល" : "results"}
      </p>
    </form>
  );
}

export function ActiveFilterChips({ filters, lang }: { filters: SearchFilters; lang: Lang }) {
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const chips: { key: keyof SearchFilters; value: string | number; label: string }[] = [];

  if (filters.q) chips.push({ key: "q", value: filters.q, label: `“${filters.q}”` });
  if (filters.make) chips.push({ key: "make", value: filters.make, label: filters.make });
  if (filters.province) chips.push({ key: "province", value: filters.province, label: filters.province });
  if (filters.minPrice != null) chips.push({ key: "minPrice", value: filters.minPrice, label: `≥ $${filters.minPrice.toLocaleString()}` });
  if (filters.maxPrice != null) chips.push({ key: "maxPrice", value: filters.maxPrice, label: `≤ $${filters.maxPrice.toLocaleString()}` });
  if (filters.minYear != null) chips.push({ key: "minYear", value: filters.minYear, label: `${filters.minYear}+` });
  if (filters.maxYear != null) chips.push({ key: "maxYear", value: filters.maxYear, label: `≤ ${filters.maxYear}` });
  if (filters.maxMileage != null) chips.push({ key: "maxMileage", value: filters.maxMileage, label: `≤ ${filters.maxMileage.toLocaleString()} km` });
  if (filters.fuel) chips.push({ key: "fuel", value: filters.fuel, label: t(`common.${filters.fuel.toLowerCase()}` as Parameters<typeof t>[0]) });
  if (filters.transmission) chips.push({ key: "transmission", value: filters.transmission, label: t(`common.${filters.transmission.toLowerCase()}` as Parameters<typeof t>[0]) });
  if (filters.bodyType) chips.push({ key: "bodyType", value: filters.bodyType, label: t(`common.${filters.bodyType.toLowerCase()}` as Parameters<typeof t>[0]) });
  if (filters.sellerType !== "all") chips.push({ key: "sellerType", value: filters.sellerType, label: filters.sellerType === "dealer" ? t("search.sellerDealer") : t("search.sellerPrivate") });
  if (filters.verifiedOnly) chips.push({ key: "verifiedOnly", value: "1", label: t("search.verifiedOnly") });

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => {
        const without = { ...filters, [chip.key]: chip.key === "verifiedOnly" ? false : chip.key === "sellerType" ? "all" : "" , page: 1 } as SearchFilters;
        if (chip.key === "minPrice" || chip.key === "maxPrice" || chip.key === "minYear" || chip.key === "maxYear" || chip.key === "maxMileage") {
          (without as Record<string, unknown>)[chip.key] = null;
        }
        return (
          <Link
            key={String(chip.key)}
            href={`/cars${filtersToQueryString(without)}`}
            className="chip no-underline hover:border-danger-600 hover:text-danger-700"
            aria-label={`Remove filter ${chip.label}`}
          >
            {chip.label} <span aria-hidden>×</span>
          </Link>
        );
      })}
      <Link href="/cars" className="ml-1 text-xs font-semibold text-brand-700 no-underline hover:underline">
        {t("search.clearAll")}
      </Link>
    </div>
  );
}
