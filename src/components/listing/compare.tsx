"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, GitCompareArrows, X } from "lucide-react";
import { clsx } from "clsx";

const KEY = "aev_compare";
const MAX = 3;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("aev-compare-change"));
}

export function CompareButton({ listingId }: { listingId: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIds(read());
    setMounted(true);
    const onChange = () => setIds(read());
    window.addEventListener("aev-compare-change", onChange);
    return () => window.removeEventListener("aev-compare-change", onChange);
  }, []);

  const selected = ids.includes(listingId);
  const toggle = useCallback(() => {
    const current = read();
    if (current.includes(listingId)) write(current.filter((id) => id !== listingId));
    else if (current.length >= MAX) write([...current.slice(1), listingId]);
    else write([...current, listingId]);
  }, [listingId]);

  if (!mounted) {
    return (
      <button type="button" className="btn btn-secondary w-full" disabled>
        <GitCompareArrows className="h-4 w-4" /> Compare
      </button>
    );
  }

  return (
    <button type="button" onClick={toggle} className={clsx("btn w-full", selected ? "btn-primary" : "btn-secondary")} aria-pressed={selected}>
      {selected ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
      {selected ? "In comparison" : "Add to compare"}
    </button>
  );
}

export function CompareBar() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const onChange = () => setIds(read());
    window.addEventListener("aev-compare-change", onChange);
    return () => window.removeEventListener("aev-compare-change", onChange);
  }, []);

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-18px_rgba(8,13,18,0.4)] backdrop-blur">
      <div className="container-wide flex items-center justify-between gap-3">
        <p className="text-sm text-ink-700">
          <span className="font-semibold text-ink-950">{ids.length}</span> of {MAX} selected for comparison
        </p>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => write([])}>
            <X className="h-4 w-4" /> Clear
          </button>
          <Link href={`/compare?ids=${ids.join(",")}`} className="btn btn-primary btn-sm no-underline">
            <GitCompareArrows className="h-4 w-4" /> Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
