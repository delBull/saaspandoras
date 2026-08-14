'use client';

import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface HermesModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}

export function HermesModulePlaceholder({ title, description, icon: Icon, features = [] }: HermesModulePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 animate-in fade-in duration-700">
      <div className="relative group mb-8">
        <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full group-hover:bg-purple-500/30 transition-all duration-500" />
        <div className="relative w-20 h-20 rounded-3xl bg-[#0C0C12] border border-white/10 flex items-center justify-center shadow-2xl">
          <Icon className="w-10 h-10 text-purple-400 opacity-80" />
          <div className="absolute -bottom-2 -right-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            INITIALIZING
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-zinc-400 text-sm max-w-md leading-relaxed mb-8">
        {description}
      </p>

      {features.length > 0 && (
        <div className="bg-[#0C0C12] border border-white/5 rounded-2xl p-6 text-left max-w-md w-full shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
            <Sparkles size={14} /> Capability Matrix
          </div>
          <ul className="space-y-3">
            {features.map((feat, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="mt-0.5 text-purple-500/50">›</span>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
