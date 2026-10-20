import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "brand" | "gold" | "ok" | "warn" | "danger" | "slate" | "plain";

const tones: Record<Tone, string> = {
  brand: "chip-brand",
  gold: "chip-gold",
  ok: "chip-ok",
  warn: "chip-warn",
  danger: "chip-danger",
  slate: "chip-slate",
  plain: "border-ink-200 bg-white text-ink-700",
};

export function Badge({
  tone = "slate",
  children,
  className,
  icon,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span className={clsx("chip", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
