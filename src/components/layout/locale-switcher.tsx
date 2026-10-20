"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/app/actions";
import type { Lang } from "@/i18n";

export function LocaleSwitcher({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const qs = search.toString();
  const next = `${pathname}${qs ? `?${qs}` : ""}`;
  const target: Lang = lang === "en" ? "km" : "en";

  return (
    <form action={setLocaleAction}>
      <input type="hidden" name="locale" value={target} />
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className={compact ? "btn btn-ghost btn-sm" : "btn btn-ghost btn-sm gap-1.5"}
        aria-label={target === "km" ? "ប្តូរទៅភាសាខ្មែរ" : "Switch to English"}
      >
        <Languages className="h-4 w-4" aria-hidden />
        <span className="font-semibold">{lang === "en" ? "ខ្មែរ" : "EN"}</span>
      </button>
    </form>
  );
}
