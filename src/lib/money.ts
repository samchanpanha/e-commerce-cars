import { KHR_PER_USD } from "./constants";

export function formatUsd(amount: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && amount >= 1000) return `$${Math.round(amount / 1000)}k`;
  return `$${amount.toLocaleString("en-US")}`;
}

export function usdToKhr(usd: number, rate = KHR_PER_USD): number {
  return Math.round((usd * rate) / 100) * 100; // nearest 100 riel
}

export function formatKhr(amountKhr: number): string {
  return `៛${amountKhr.toLocaleString("en-US")}`;
}

/** "$15,500 · ≈ ៛63,550,000" — always marks the riel figure as indicative. */
export function formatPricePair(usd: number, locale: "en" | "km", rate = KHR_PER_USD): string {
  const khr = formatKhr(usdToKhr(usd, rate));
  return locale === "km" ? `${formatUsd(usd)} (≈ ${khr})` : `${formatUsd(usd)} · ≈ ${khr}`;
}

export function formatMileage(km: number, locale: "en" | "km" = "en"): string {
  return `${km.toLocaleString(locale === "km" ? "km-KH" : "en-US")} km`;
}

export function formatDate(date: Date | number | null | undefined, locale: "en" | "km" = "en"): string {
  if (!date) return "—";
  const d = typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | number | null | undefined, locale: "en" | "km" = "en"): string {
  if (!date) return "—";
  const d = typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function timeAgo(date: Date | number, locale: "en" | "km" = "en"): string {
  const then = typeof date === "number" ? date : date.getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (locale === "km") {
    if (mins < 60) return `${Math.max(mins, 1)} នាទីមុន`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} ម៉ោងមុន`;
    const days = Math.round(hours / 24);
    return `${days} ថ្ងៃមុន`;
  }
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(then);
}
