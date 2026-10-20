"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function SortSelect({
  options,
  label,
}: {
  options: { value: string; label: string }[];
  label: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = params.get("sort") ?? "relevance";

  return (
    <label className="flex items-center gap-2 text-sm text-ink-500">
      <span className="hidden sm:inline">{label}</span>
      <select
        className="select !w-auto !py-2 text-sm"
        value={current}
        disabled={pending}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "relevance") next.delete("sort");
          else next.set("sort", e.target.value);
          next.delete("page");
          startTransition(() => router.push(`/cars?${next.toString()}`));
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
