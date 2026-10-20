"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CarFront } from "lucide-react";

const KEY = "aev_recent";
type Item = { slug: string; title: string; price: number; image: string | null; at: number };

export function TrackView({ item }: { item: Omit<Item, "at"> }) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const list: Item[] = raw ? JSON.parse(raw) : [];
      const next = [{ ...item, at: Date.now() }, ...list.filter((x) => x.slug !== item.slug)].slice(0, 8);
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage is optional; never break the page for it.
    }
  }, [item]);
  return null;
}

export function RecentlyViewed({ emptyLabel }: { emptyLabel: string }) {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      setItems(raw ? (JSON.parse(raw) as Item[]).slice(0, 4) : []);
    } catch {
      setItems([]);
    }
  }, []);

  if (items === null) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
    );
  }

  if (items.length === 0) return <p className="text-sm text-ink-500">{emptyLabel}</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link key={item.slug} href={`/cars/${item.slug}`} className="flex items-center gap-3 rounded-xl border border-ink-200 p-2 no-underline transition hover:border-brand-500">
          <span className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-100">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <CarFront className="h-5 w-5 text-ink-400" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink-900">{item.title}</span>
            <span className="block text-xs text-ink-500">${item.price.toLocaleString("en-US")}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
