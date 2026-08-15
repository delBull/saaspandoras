import React from 'react';
import { ShieldCheck, AlertCircle, Check, X } from 'lucide-react';
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
    <div className="flex flex-col border border-white/5 bg-white/[0.01] rounded-2xl p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl text-white/90 font-medium tracking-tight">VERIFIED KNOWLEDGE</h2>
          <p className="text-white/50 text-sm mt-1">Facts Hermes can use with evidence.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {facts.length === 0 && (
          <div className="text-white/40 text-sm py-4">
            No knowledge facts found. Upload documents to extract facts.
          </div>
        )}

        {pendingFacts.map(fact => (
          <div key={fact.id} className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="w-full">
                <div className="text-white/90 font-medium mb-1">
                  "{fact.content}"
                </div>
                <div className="text-rose-400/70 text-xs font-mono uppercase tracking-wider flex justify-between items-center w-full mt-2">
                  <span>Source: {fact.source} · Pending Review</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onReject?.(fact.id)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded transition-colors"
                      title="Reject Fact"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onApprove?.(fact.id)}
                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {activeFacts.map(fact => (
          <div key={fact.id} className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white/90 font-medium mb-1">
                  "{fact.content}"
                </div>
                <div className="text-emerald-400/70 text-xs font-mono uppercase tracking-wider">
                  Source: {fact.source} · Verified
                </div>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
