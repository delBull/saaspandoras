import React, { useState } from 'react';
import { Database, Key, Shield, Layers, ChevronRight, Hash, Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { KnowledgeOverviewView } from '@/lib/dash-contracts/knowledge';

export function KnowledgeAdvancedPanel({ overview }: { overview: KnowledgeOverviewView }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-6 flex items-center justify-between w-full hover:bg-white/[0.02] transition-colors text-left"
      >
        <h2 className="text-sm font-mono uppercase tracking-widest text-white/50 hover:text-white/80 transition-colors">
          Advanced Diagnostics
        </h2>
        {isOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {isOpen && (
        <div className="p-6 pt-0 border-t border-white/5">
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 text-sm">
              <span className="text-white/40 shrink-0">Embedding Provider</span>
              <span className="text-white/70 font-mono break-all text-left sm:text-right">MockEmbeddingProvider</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 text-sm">
              <span className="text-white/40 shrink-0">Index Engine</span>
              <span className="text-white/70 font-mono break-all text-left sm:text-right">PostgresKnowledgeIndex</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 text-sm">
              <span className="text-white/40 shrink-0">Runtime Version</span>
              <span className="text-white/70 font-mono break-all text-left sm:text-right">KnowledgeRuntime v1</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 text-sm">
              <span className="text-white/40 shrink-0">Total Chunks Indexed</span>
              <span className="text-white/70 font-mono break-all text-left sm:text-right">~142</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
