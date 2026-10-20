"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { clsx } from "clsx";

export function FavoriteButton({
  listingId,
  initial = false,
  withLabel = false,
  className,
}: {
  listingId: string;
  initial?: boolean;
  withLabel?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    setError(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, action: next ? "add" : "remove" }),
        });
        if (!res.ok) throw new Error("failed");
      } catch {
        setSaved(!next);
        setError(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved cars" : "Save this car"}
      title={error ? "Could not save. Sign in and try again." : undefined}
      className={clsx(
        withLabel ? "btn btn-secondary w-full justify-center" : "grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/95 text-ink-700 shadow-sm backdrop-blur transition hover:bg-white",
        className,
      )}
    >
      <Heart className={clsx("h-4 w-4", saved && "fill-danger-600 text-danger-600")} aria-hidden />
      {withLabel ? <span>{saved ? "Saved" : "Save this car"}</span> : null}
    </button>
  );
}
