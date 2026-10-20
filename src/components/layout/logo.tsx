import Link from "next/link";
import { clsx } from "clsx";

export function Logo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="AngkorEV home">
      <span
        className={clsx(
          "grid h-9 w-9 place-items-center rounded-xl",
          inverted ? "bg-white text-brand-800" : "bg-brand-700 text-white",
        )}
      >
        {/* Abstract temple tower + road mark: distinctive, no stock car icon. */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3 5 8v2h14V8l-7-5Z" fill="currentColor" opacity=".9" />
          <path d="M8 10v7h8v-7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 20h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 13v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".6" />
        </svg>
      </span>
      {!compact ? (
        <span className={clsx("text-[17px] font-bold tracking-tight", inverted ? "text-white" : "text-ink-950")}>
          Angkor<span className={inverted ? "text-brand-300" : "text-brand-700"}>EV</span>
        </span>
      ) : null}
    </Link>
  );
}
