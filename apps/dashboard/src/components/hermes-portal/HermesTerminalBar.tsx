'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function HermesTerminalBar({ sidebarCollapsed = true }: { sidebarCollapsed?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`border-t border-white/10 bg-[#08080A] flex flex-col fixed bottom-0 right-0 z-40 text-[11px] font-mono text-zinc-500 transition-all duration-300 ${sidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-64'} ${isExpanded ? 'h-64' : 'h-10'}`}>
        <div className="flex items-center justify-between px-4 shrink-0 h-10 w-full">
            <div className="flex items-center gap-6 h-full">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center hover:text-zinc-300 transition-colors h-full px-2 border-b-2 border-transparent hover:border-zinc-500">
                    {isExpanded ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronUp className="w-4 h-4 mr-1" />}
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

        {isExpanded && (
            <div className="flex-1 w-full bg-[#050507] p-4 overflow-y-auto border-t border-white/5">
                <div className="font-mono text-xs text-zinc-400 space-y-1">
                    <div className="text-zinc-500">[{new Date().toISOString()}] <span className="text-emerald-400">SYSTEM:</span> Hermes OS initialized and stable.</div>
                    <div className="text-zinc-500">[{new Date().toISOString()}] <span className="text-blue-400">CORE:</span> Connected to main database cluster.</div>
                    <div className="text-zinc-500">[{new Date().toISOString()}] <span className="text-purple-400">NETWORK:</span> Established secure connection with tenant portal.</div>
                    <div className="text-zinc-500">[{new Date().toISOString()}] <span className="text-indigo-400">AGENT:</span> Waiting for instructions...</div>
                </div>
            </div>
        )}
    </div>
  );
}
