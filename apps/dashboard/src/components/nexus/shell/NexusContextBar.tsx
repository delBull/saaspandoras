"use client";

import React from "react";

export function NexusContextBar() {
  return (
    <footer className="h-9 shrink-0 relative z-20 flex items-center justify-between px-4 md:px-6 bg-[#07070B] border-t border-white/[0.08] font-mono text-[10px] text-zinc-500">
      <span className="truncate">UNIFIED INDEX · PANDORAS GROWTH OS & PLATFORM ECOSYSTEM</span>
      <span className="hidden sm:flex items-center gap-3 shrink-0">
        <span>NEXUS v2.5</span>
        <span className="text-zinc-500/40">•</span>
        <span className="text-purple-300/80">5 CATEGORIES</span>
        <span className="text-zinc-500/40">•</span>
        <span className="text-amber-300/80">DEAL ROOM ONLINE</span>
        <span className="text-zinc-500/40">•</span>
        <span>OPS HUB ONLINE</span>
      </span>
    </footer>
  );
}
