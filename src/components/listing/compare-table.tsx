"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, GitCompareArrows, Loader2, Search, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import { translate, type Lang, type TranslationKey } from "@/i18n/dictionary";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { formatPricePair } from "@/lib/money";

const KEY = "aev_compare";
const MAX = 3;

type ReportSummary = {
  publicId: string;
  status: string;
  confidence: number | null;
  riskLevel: string | null;
  counts: { verified: number; evidence: number; inconsistency: number; notVerified: number; noData: number };
};

type CompareItem = {
  id: string;
  slug: string;
  name: string;
  priceUsd: number;
  priceKhr: number | null;
  condition: string;
  province: string;
  image: string | null;
  year: number;
  mileageKm: number;
  transmission: string;
  fuelType: string;
  engineCc: number | null;
  drivetrain: string | null;
  bodyType: string;
  exteriorColor: string | null;
  seats: number | null;
  vinStatus: string;
  inspectionAvailable: boolean;
  ownershipDocStatus: string;
  sellerName: string;
  tenantName: string | null;
  tenantVerified: boolean;
  sellerType: string;
  report: ReportSummary | null;
};

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("aev-compare-change"));
}

export function CompareTable({ lang }: { lang: Lang }) {
  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<CompareItem[]>([]);
  const [removed, setRemoved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextIds: string[]) => {
    if (nextIds.length === 0) {
      setItems([]);
      setRemoved(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/compare?ids=${encodeURIComponent(nextIds.join(","))}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not load the comparison.");
      const nextItems: CompareItem[] = json.data.items;
      setItems(nextItems);
      setRemoved(nextIds.length - nextItems.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the comparison.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = readIds();
    setIds(initial);
    void load(initial);
    const onChange = () => {
      const next = readIds();
      setIds(next);
      void load(next);
    };
    window.addEventListener("aev-compare-change", onChange);
    return () => window.removeEventListener("aev-compare-change", onChange);
  }, [load]);

  function remove(id: string) {
    writeIds(readIds().filter((value) => value !== id));
  }

  function clear() {
    writeIds([]);
  }

  const cheapest = Math.min(...items.map((item) => item.priceUsd));
  const lowestKm = Math.min(...items.map((item) => item.mileageKm));
  const newest = Math.max(...items.map((item) => item.year));

  const rows: {
    label: string;
    value: (item: CompareItem) => React.ReactNode;
    highlight?: (item: CompareItem) => boolean;
  }[] = [
    {
      label: t("common.price"),
      value: (item) => <p className="font-semibold text-ink-950">{formatPricePair(item.priceUsd, lang)}</p>,
      highlight: (item) => items.length > 1 && item.priceUsd === cheapest,
    },
    { label: t("common.year"), value: (item) => item.year, highlight: (item) => items.length > 1 && item.year === newest },
    {
      label: t("common.mileage"),
      value: (item) => `${item.mileageKm.toLocaleString("en-US")} ${t("common.km")}`,
      highlight: (item) => items.length > 1 && item.mileageKm === lowestKm,
    },
    { label: t("common.transmission"), value: (item) => t(`common.${item.transmission.toLowerCase()}` as TranslationKey) },
    { label: t("common.fuel"), value: (item) => t(`common.${item.fuelType.toLowerCase()}` as TranslationKey) },
    { label: t("listing.spec.engine"), value: (item) => (item.engineCc ? `${item.engineCc.toLocaleString("en-US")} cc` : "—") },
    { label: t("listing.spec.drivetrain"), value: (item) => item.drivetrain ?? "—" },
    { label: t("common.body"), value: (item) => t(`common.${item.bodyType.toLowerCase()}` as TranslationKey) },
    { label: t("listing.spec.color"), value: (item) => item.exteriorColor ?? "—" },
    { label: t("listing.spec.seats"), value: (item) => item.seats ?? "—" },
    { label: t("common.location"), value: (item) => item.province },
    {
      label: t("compare.seller"),
      value: (item) => (
        <div>
          <p className="font-medium text-ink-800">{item.tenantName ?? t("common.private seller")}</p>
          <p className="text-[11px] text-ink-400">{item.sellerName}</p>
        </div>
      ),
    },
    {
      label: t("listing.sellerVerified"),
      value: (item) =>
        item.sellerType === "dealer" ? (
          item.tenantVerified ? (
            <Badge tone="ok" icon={<Check className="h-3 w-3" />}>{t("common.verified")}</Badge>
          ) : (
            <Badge tone="slate">{t("common.unverified")}</Badge>
          )
        ) : (
          <Badge tone="slate">{t("common.private seller")}</Badge>
        ),
    },
    {
      label: t("compare.ownership"),
      value: (item) => t(`listingForm.ownership.${item.ownershipDocStatus}` as TranslationKey),
    },
    {
      label: t("compare.inspection"),
      value: (item) => (item.inspectionAvailable ? t("common.yes") : t("common.no")),
    },
    {
      label: t("listing.spec.vin"),
      value: (item) =>
        item.vinStatus === "PROVIDED" ? (
          <span className="text-ok-700">{t("common.verified")}</span>
        ) : item.vinStatus === "INVALID" ? (
          <span className="text-danger-700">{t("report.inconsistencies")}</span>
        ) : (
          <span className="text-ink-400">{t("listing.spec.notProvided")}</span>
        ),
    },
    {
      label: t("compare.report"),
      value: (item) =>
        item.report ? (
          <div className="space-y-1">
            <Link href={`/reports/${item.report.publicId}`} className="no-underline">
              <Badge tone={item.report.status === "READY" ? "ok" : "warn"}>
                {t(`report.status.${item.report.status}` as TranslationKey)}
              </Badge>
            </Link>
            {item.report.confidence !== null ? (
              <p className="text-[11px] text-ink-400">{t("report.confidence")}: {item.report.confidence}%</p>
            ) : null}
          </div>
        ) : (
          <span className="text-ink-400">{t("compare.noReport")}</span>
        ),
    },
    {
      label: t("compare.verifiedRecords"),
      value: (item) => (item.report ? item.report.counts.verified + item.report.counts.evidence : "—"),
    },
    {
      label: t("compare.inconsistencies"),
      value: (item) =>
        item.report ? (
          <span className={item.report.counts.inconsistency > 0 ? "font-semibold text-danger-700" : "text-ink-500"}>
            {item.report.counts.inconsistency}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-10 text-sm text-ink-500">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("compare.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-xl border border-danger-200 bg-danger-50 px-4 py-6 text-sm text-danger-800">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<GitCompareArrows className="h-8 w-8" />}
          title={t("compare.empty")}
          body={t("compare.emptyBody")}
          action={
            <Link href="/cars" className="btn btn-primary no-underline">
              <Search className="h-4 w-4" /> {t("nav.browse")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          {ids.length} {t("common.of")} {MAX} · {t("compare.max")}
        </p>
        <button type="button" onClick={clear} className="btn btn-ghost btn-sm">
          <Trash2 className="h-3.5 w-3.5" /> {t("compare.clear")}
        </button>
      </div>

      {removed > 0 ? (
        <p className="mt-2 rounded-lg border border-warn-200 bg-warn-50 px-3 py-2 text-xs text-warn-800">{t("compare.removed")}</p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 border-b border-ink-200 bg-ink-50 p-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {t("compare.spec")}
              </th>
              {items.map((item) => (
                <th key={item.id} className="min-w-[190px] border-b border-l border-ink-100 p-3 align-top text-left font-normal">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`${t("compare.remove")} ${item.name}`}
                      className="absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink-400 shadow-sm hover:bg-danger-50 hover:text-danger-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/cars/${item.slug}`} className="block no-underline">
                      <div className="h-28 w-full overflow-hidden rounded-lg bg-ink-100">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <p className="mt-2 pr-6 text-sm font-semibold leading-snug text-ink-950">{item.name}</p>
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {items.length > 1 && item.priceUsd === cheapest ? <Badge tone="gold">{t("compare.cheapest")}</Badge> : null}
                      {items.length > 1 && item.mileageKm === lowestKm ? <Badge tone="brand">{t("compare.lowestKm")}</Badge> : null}
                      {items.length > 1 && item.year === newest ? <Badge tone="brand">{t("compare.newest")}</Badge> : null}
                    </div>
                    <Link href={`/cars/${item.slug}`} className="btn btn-secondary btn-sm mt-2 w-full justify-center no-underline">
                      {t("compare.view")}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="even:bg-ink-50/40">
                <th scope="row" className="sticky left-0 z-10 border-b border-ink-100 bg-white p-3 text-left text-xs font-medium text-ink-500 even:bg-ink-50/40">
                  {row.label}
                </th>
                {items.map((item) => (
                  <td
                    key={item.id}
                    className={clsx(
                      "border-b border-l border-ink-100 p-3 align-top text-xs text-ink-700",
                      row.highlight?.(item) && "bg-brand-50/60",
                    )}
                  >
                    {row.value(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
        {t("compare.reportNote")}
      </p>
    </div>
  );
}
