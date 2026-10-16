import React from "react";

export function CatalogSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 flex flex-col gap-4 animate-pulse shadow-lg"
        >
          {/* Media Skeleton */}
          <div className="w-full h-44 rounded-xl bg-zinc-800/60 relative overflow-hidden" />

          {/* Badges Skeleton */}
          <div className="flex gap-2">
            <div className="h-5 w-24 rounded-full bg-zinc-800/80" />
            <div className="h-5 w-20 rounded-full bg-zinc-800/50" />
          </div>

          {/* Title & Description Skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-6 w-3/4 rounded bg-zinc-800/90" />
            <div className="h-4 w-full rounded bg-zinc-800/50" />
            <div className="h-4 w-5/6 rounded bg-zinc-800/40" />
          </div>

          {/* Footer Skeleton */}
          <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-center justify-between">
            <div className="h-5 w-20 rounded bg-zinc-800/70" />
            <div className="h-9 w-28 rounded-lg bg-zinc-800/90" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserSpaceSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="h-28 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-zinc-800/80" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-48 rounded bg-zinc-800/90" />
          <div className="h-4 w-32 rounded bg-zinc-800/50" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 rounded-2xl border border-zinc-800/80 bg-zinc-950/40" />
        <div className="h-48 rounded-2xl border border-zinc-800/80 bg-zinc-950/40" />
      </div>
    </div>
  );
}
