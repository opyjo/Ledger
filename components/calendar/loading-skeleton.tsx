"use client";

export function CalendarSkeleton() {
  return (
    <div className="grid flex-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <section className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="flex gap-1.5">
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted" />
          ))}
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={`d${i}`} className="aspect-square animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm">
        <div className="mb-4 h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </section>
    </div>
  );
}
