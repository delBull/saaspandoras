"use client";

import React from "react";
import Link from "next/link";
import { Activity, TerminalSquare, Handshake, Code2, GraduationCap } from "lucide-react";

interface NexusHeaderProps {
  role: string | null;
  setIsOpsModalOpen: (val: boolean) => void;
}

export function NexusHeader({ role, setIsOpsModalOpen }: NexusHeaderProps) {
  return (
    <header className="h-12 shrink-0 relative z-20 flex items-center justify-between px-4 md:px-6 bg-[#07070B] border-b border-white/[0.08] font-mono">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10">
            <span className="text-purple-300 text-[10px] tracking-widest">NEXUS</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </span>
            LIVE INDEX
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] text-zinc-500 truncate">
          <span className="text-zinc-500/40">•</span>
          <span>5 Domains</span>
          <span className="text-zinc-500/40">•</span>
          <span>40 Destinations</span>
          <span className="text-zinc-500/40">•</span>
          <span>Engine: Nexus v1.0</span>
        </div>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar shrink-0 ml-auto pr-2 sm:pr-0">
        <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/10 bg-black/40 text-zinc-400 text-[10px] shrink-0">
          <Activity className="w-3 h-3 text-purple-300" />
          UNIFIED INDEX
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOpsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] tracking-wider hover:bg-purple-500/20 transition-colors shrink-0"
          >
            <TerminalSquare className="w-3 h-3" />
            OPERATIONS HUB
          </button>
          <Link
            href="/nexus/rooms"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] tracking-wider hover:bg-amber-500/20 transition-colors shrink-0"
          >
            <Handshake className="w-3 h-3" />
            DEAL ROOM
          </Link>
          {(role === "SUPER_ADMIN" || role === "ADMIN") && (
            <Link
              href="/nexus/developers"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-300 text-[10px] tracking-wider hover:bg-sky-500/20 transition-colors shrink-0"
            >
              <Code2 className="w-3 h-3" />
              DEVELOPER HUB
            </Link>
          )}
          {role === "SUPER_ADMIN" && (
            <Link
              href="/admin/academy"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] tracking-wider hover:bg-purple-500/20 transition-colors shrink-0"
            >
              <GraduationCap className="w-3 h-3" />
              ACADEMY
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
