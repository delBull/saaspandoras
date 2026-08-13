import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { KnowledgeOverviewView } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';

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
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Embedding Provider</span>
              <span className="text-white/70 font-mono">MockEmbeddingProvider</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Index Engine</span>
              <span className="text-white/70 font-mono">PostgresKnowledgeIndex</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Runtime Version</span>
              <span className="text-white/70 font-mono">KnowledgeRuntime v1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Total Chunks Indexed</span>
              <span className="text-white/70 font-mono">~142</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
