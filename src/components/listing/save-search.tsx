"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus, Check } from "lucide-react";

export function SaveSearchButton({ query, defaultName }: { query: string; defaultName: string }) {
  const [state, setState] = useState<"idle" | "saved" | "error" | "auth">("idle");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/saved-searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: defaultName.slice(0, 80) || "Search", query }),
        });
        if (res.status === 401) return setState("auth");
        if (!res.ok) return setState("error");
        setState("saved");
      } catch {
        setState("error");
      }
    });
  }

  if (state === "saved") {
    return (
      <span className="chip chip-ok">
        <Check className="h-3.5 w-3.5" /> Saved
      </span>
    );
  }
  if (state === "auth") {
    return (
      <a href="/login?next=/cars" className="btn btn-secondary btn-sm no-underline">
        <BookmarkPlus className="h-4 w-4" /> Sign in to save
      </a>
    );
  }

  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={save} disabled={pending}>
      <BookmarkPlus className="h-4 w-4" />
      {state === "error" ? "Try again" : pending ? "Saving…" : "Save this search"}
    </button>
  );
}
