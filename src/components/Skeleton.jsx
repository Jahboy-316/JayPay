export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-[var(--surface)] border border-[var(--border)] squircle ${className}`}
    />
  );
}

export function BalanceCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] squircle-card p-6 flex flex-col gap-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-48" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
