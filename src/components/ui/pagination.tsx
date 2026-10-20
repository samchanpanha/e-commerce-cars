import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  buildHref,
  labels,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  labels: { previous: string; next: string; page: string; of: string };
}) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let i = start; i < start + 5 && i <= totalPages; i += 1) pages.push(i);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="btn btn-secondary btn-sm" aria-label={labels.previous}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? "btn btn-primary btn-sm min-w-9"
              : "btn btn-secondary btn-sm min-w-9"
          }
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className="btn btn-secondary btn-sm" aria-label={labels.next}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
