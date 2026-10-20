"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/app/actions";
import type { Lang } from "@/i18n";

export function LocaleSwitcher({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const pathname = usePathname();
  const target: Lang = lang === "en" ? "km" : "en";

  // Keep the current query string on the redirect, but read it after mount.
  // useSearchParams would force every page using the header into a Suspense
  // boundary, and its server value can differ from the browser's during
  // hydration on query-string URLs.
  const [next, setNext] = useState(pathname);
  useEffect(() => {
    setNext(`${pathname}${window.location.search}`);
  }, [pathname]);

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
