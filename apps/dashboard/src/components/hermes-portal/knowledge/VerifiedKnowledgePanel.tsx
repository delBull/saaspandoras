import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export function VerifiedKnowledgePanel() {
  return (
    <div className="flex flex-col border border-white/5 bg-white/[0.01] rounded-2xl p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl text-white/90 font-medium tracking-tight">VERIFIED KNOWLEDGE</h2>
          <p className="text-white/50 text-sm mt-1">Facts Hermes can use with evidence.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {/* Mock Data for UX Design */}
        <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-white/90 font-medium mb-1">
                "ELD specializes in residential real estate development."
              </div>
              <div className="text-emerald-400/70 text-xs font-mono uppercase tracking-wider">
                Source: Company Overview · Verified
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-white/90 font-medium mb-1">
                "Expected ROI is 12% annually."
              </div>
              <div className="text-rose-400/70 text-xs font-mono uppercase tracking-wider flex justify-between items-center w-full">
                <span>Requires governance approval</span>
                <button className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded transition-colors">
                  Review
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
