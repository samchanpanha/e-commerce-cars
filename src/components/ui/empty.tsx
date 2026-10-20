import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-ink-400">{icon}</div> : null}
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {body ? <p className="mt-1.5 max-w-md text-sm text-ink-500">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
