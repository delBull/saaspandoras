'use client';

import React from 'react';

export function HermesTerminalBar() {
  return (
    <div className="h-10 border-t border-white/10 bg-[#08080A] flex items-center justify-between px-4 fixed bottom-0 left-0 right-0 z-40 text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-6 h-full">
            <button className="flex items-center hover:text-zinc-300 transition-colors h-full px-2 border-b-2 border-transparent hover:border-zinc-500">
                <span className="mr-2">^</span>
            </button>
            <button className="flex items-center text-purple-400 border-b-2 border-purple-500/50 h-full px-2">
                EVENTS (25)
            </button>
            <button className="flex items-center hover:text-zinc-300 transition-colors h-full px-2 border-b-2 border-transparent hover:border-zinc-500">
                SYSTEM LOGS
            </button>
            <button className="flex items-center hover:text-zinc-300 transition-colors h-full px-2 border-b-2 border-transparent hover:border-zinc-500">
                AI THOUGHTS
            </button>
        </div>
        <div className="flex items-center gap-4 text-zinc-600">
            <span>LIVE FEED</span>
            <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                STABILIZED
            </span>
        </div>
    </div>
  );
}
