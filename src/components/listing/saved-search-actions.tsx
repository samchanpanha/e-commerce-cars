"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function SavedSearchActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm text-danger-700"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch(`/api/saved-searches?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          router.refresh();
        })
      }
      aria-label="Delete saved search"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
