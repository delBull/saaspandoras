"use client";

import React from "react";

export function NexusShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 w-full overflow-hidden bg-[#050508] text-white selection:bg-amber-500/30 flex flex-col font-sans">
      {/* ── AMBIENT GLOW + GRID (Atmósfera Obsidian Institucional) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/4 w-[45vw] h-[45vw] bg-purple-600/[0.04] rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute -bottom-1/4 right-1/4 w-[35vw] h-[35vw] bg-amber-500/[0.03] rounded-full blur-[130px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(120,50,255,0.03),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_60%,transparent_100%)] opacity-70" />
      </div>

      {children}
    </div>
  );
}
