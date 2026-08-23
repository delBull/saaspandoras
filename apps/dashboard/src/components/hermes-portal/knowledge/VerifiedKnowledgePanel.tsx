import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Check, X, FileCode, Tag, Hash, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import type { KnowledgeFactView } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';

interface VerifiedKnowledgePanelProps {
  facts?: KnowledgeFactView[];
  onApprove?: (factId: string) => void;
  onReject?: (factId: string) => void;
}

export function VerifiedKnowledgePanel({ facts = [], onApprove, onReject }: VerifiedKnowledgePanelProps) {
  const activeFacts = facts.filter(f => f.status === 'ACTIVE');
  const pendingFacts = facts.filter(f => f.status === 'PENDING_REVIEW');

  return (
    <div className="flex flex-col border border-white/5 bg-white/[0.01] rounded-2xl p-4 sm:p-6 overflow-hidden max-w-full">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl text-white/90 font-medium tracking-tight">VERIFIED KNOWLEDGE</h2>
          <p className="text-white/50 text-sm mt-1">Facts and structured assertions Hermes can use with evidence.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 max-w-full">
        {facts.length === 0 && (
          <div className="text-white/40 text-sm py-4">
            No knowledge facts found. Upload documents to extract facts.
          </div>
        )}

        {pendingFacts.map(fact => (
          <FactCard 
            key={fact.id} 
            fact={fact} 
            isPending 
            onApprove={() => onApprove?.(fact.id)} 
            onReject={() => onReject?.(fact.id)} 
          />
        ))}

        {activeFacts.map(fact => (
          <FactCard 
            key={fact.id} 
            fact={fact} 
          />
        ))}
      </div>
    </div>
  );
}

function FactCard({
  fact,
  isPending = false,
  onApprove,
  onReject
}: {
  fact: KnowledgeFactView;
  isPending?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Try parsing structured JSON
  let parsedJson: Record<string, any> | null = null;
  if (typeof fact.content === 'string' && (fact.content.trim().startsWith('{') || fact.content.trim().startsWith('{"'))) {
    try {
      parsedJson = JSON.parse(fact.content.trim());
    } catch {
      parsedJson = null;
    }
  }

  return (
    <div className={`p-4 rounded-xl border max-w-full overflow-hidden transition-all ${
      isPending 
        ? 'border-rose-500/20 bg-rose-500/5' 
        : 'border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/20'
    }`}>
      <div className="flex items-start gap-3 min-w-0 max-w-full">
        {isPending ? (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        )}
        
        <div className="min-w-0 flex-1 overflow-hidden space-y-2.5">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {fact.key && (
                <span className="text-[11px] font-mono font-bold text-white/70 bg-white/5 px-2 py-0.5 rounded border border-white/10 truncate max-w-[200px]">
                  {fact.key}
                </span>
              )}
              {fact.dimension && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {fact.dimension}
                </span>
              )}
            </div>

            <div className={`text-[10px] font-mono uppercase tracking-wider ${
              isPending ? 'text-rose-400/80' : 'text-emerald-400/70'
            }`}>
              Source: {fact.source || 'IPFS'} · {isPending ? 'Pending' : 'Verified'}
            </div>
          </div>

          {/* Content Rendering */}
          {parsedJson ? (
            <div className="bg-[#08080C] border border-white/5 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-white/50 text-[11px] font-mono">
                <FileCode size={13} className="text-emerald-400" />
                <span>Structured Artifact Metadata</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
                {Object.entries(parsedJson).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <span className="text-white/40 font-mono text-[10px] uppercase shrink-0">{k}:</span>
                    <span className="font-mono text-white/90 truncate text-[11px]" title={String(v)}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="min-w-0 max-w-full">
              <div className={`text-white/90 font-normal leading-relaxed text-xs sm:text-sm break-words whitespace-pre-wrap font-sans ${
                !expanded && fact.content.length > 250 ? 'line-clamp-3' : ''
              }`}>
                {fact.content}
              </div>
              {fact.content.length > 250 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {expanded ? (
                    <><span>Mostrar menos</span> <ChevronUp size={12} /></>
                  ) : (
                    <><span>Ver texto completo</span> <ChevronDown size={12} /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Actions for Pending */}
          {isPending && (
            <div className="flex justify-end gap-2 pt-2 border-t border-rose-500/20">
              <button 
                onClick={onReject}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Rechazar
              </button>
              <button 
                onClick={onApprove}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Aprobar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
