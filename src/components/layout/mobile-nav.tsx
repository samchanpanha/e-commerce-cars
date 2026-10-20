"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export type MobileNavItem = { href: string; label: string };

export function MobileNav({ items, footer }: { items: MobileNavItem[]; footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!items.length && !footer) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm md:hidden"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink-950/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[84%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <span className="text-sm font-bold text-ink-900">Menu</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-[15px] font-medium text-ink-800 no-underline hover:bg-ink-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {footer ? <div className="border-t border-ink-100 p-3">{footer}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
