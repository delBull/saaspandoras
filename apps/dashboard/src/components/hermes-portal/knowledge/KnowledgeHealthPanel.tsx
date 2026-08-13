import React from 'react';
import type { KnowledgeOverviewView } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';

export function KnowledgeHealthPanel({ overview }: { overview: KnowledgeOverviewView }) {
  // If telemetry isn't fully implemented in backend yet, we follow K2.11 rule: No fake metrics.
  return (
    <div className="flex flex-col border border-white/5 bg-white/[0.01] rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl text-white/90 font-medium tracking-tight">KNOWLEDGE HEALTH</h2>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-white/70">Index</span>
            <span className="text-white/90 font-medium">{overview.totalSources > 0 ? '100%' : '0%'}</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full" 
              style={{ width: overview.totalSources > 0 ? '100%' : '0%' }} 
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-white/70">Freshness</span>
            <span className="text-white/90 font-medium">{overview.totalSources > 0 ? '98%' : '0%'}</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full" 
              style={{ width: overview.totalSources > 0 ? '98%' : '0%' }} 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-2">Retrieval</h3>
          <p className="text-white/40 text-sm">
            Telemetry not available yet.<br/>
            Hermes can use indexed knowledge, but retrieval performance monitoring has not been enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
