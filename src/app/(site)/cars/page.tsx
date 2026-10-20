import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { EMPTY_FILTERS, filtersToQueryString, parseSearchParams, searchListings } from "@/lib/listings";
import { getT } from "@/i18n";
import { CarCard } from "@/components/listing/car-card";
import { ActiveFilterChips, SearchFilters } from "@/components/listing/filters";
import { SortSelect } from "@/components/listing/sort-select";
import { SaveSearchButton } from "@/components/listing/save-search";
import { EmptyState } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { CompareBar } from "@/components/listing/compare";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const make = typeof sp.make === "string" ? sp.make : "";
  const title = [make, q].filter(Boolean).join(" ") || "Used cars";
  return { title: `${title} for sale in Cambodia` };
}

function toParams(sp: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  return params;
}

export default async function CarsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const params = toParams(sp);
  const filters = parseSearchParams(params);
  const { lang, t } = await getT();
  const { items, total } = await searchListings(filters);
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  const sortOptions = [
    { value: "relevance", label: t("search.sort.relevance") },
    { value: "newest", label: t("search.sort.newest") },
    { value: "price_asc", label: t("search.sort.price_asc") },
    { value: "price_desc", label: t("search.sort.price_desc") },
    { value: "mileage_asc", label: t("search.sort.mileage_asc") },
    { value: "year_desc", label: t("search.sort.year_desc") },
  ];

  return (
    <div className="container-wide py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">{t("search.title")}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {total === 1 ? t("search.resultsOne") : t("search.results", { count: total.toLocaleString("en-US") })}
            {filters.province ? ` · ${filters.province}` : ""}
            {filters.make ? ` · ${filters.make}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveSearchButton query={params.toString()} defaultName={[filters.make, filters.model, filters.province, filters.q].filter(Boolean).join(" · ") || "All cars"} />
          <SortSelect options={sortOptions} label={t("search.sortLabel")} current={filters.sort} query={params.toString()} />
        </div>
      </div>

      <div className="mt-5">
        <ActiveFilterChips filters={filters} lang={lang} />
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[280px_1fr]">
        {/* mobile filter toggle */}
        <details className="card p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink-900">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> {t("common.filters")}
            </span>
            <span className="chip chip-slate">{t("search.filterActive")}</span>
          </summary>
          <div className="mt-4 border-t border-ink-100 pt-4">
            <SearchFilters filters={filters} lang={lang} resultCount={total} />
          </div>
        </details>

        <aside className="hidden lg:block">
          <div className="card sticky top-20 p-4">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-950">
              <SlidersHorizontal className="h-4 w-4" /> {t("common.filters")}
            </h2>
            <SearchFilters filters={filters} lang={lang} resultCount={total} />
          </div>
        </aside>

        <section aria-live="polite">
          {items.length === 0 ? (
            <EmptyState
              title={t("search.noResults")}
              body={t("search.noResultsBody")}
              icon={<SearchX className="h-8 w-8" />}
              action={
                <Link href="/cars" className="btn btn-primary">
                  {t("search.clearAll")}
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((car) => (
                  <CarCard key={car.id} car={car} lang={lang} />
                ))}
              </div>
              <Pagination
                page={filters.page}
                totalPages={totalPages}
                buildHref={(page) => `/cars${filtersToQueryString(filters, { page })}`}
                labels={{ previous: t("common.previous"), next: t("common.next"), page: t("common.page"), of: t("common.of") }}
              />
            </>
          )}
        </section>
      </div>

      <CompareBar />
    </div>
  );
}

export function generateStaticParams() {
  return [];
}

export const revalidate = 0;
