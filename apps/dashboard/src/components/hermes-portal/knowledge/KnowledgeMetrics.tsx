import React from 'react';
import type { KnowledgeOverviewView } from '@/lib/dash-contracts/knowledge';

export function KnowledgeMetrics({ overview }: { overview: KnowledgeOverviewView }) {
  // KnowledgeHealth resolution
  let healthDisplay = 'HEALTHY';
  let healthColor = 'text-emerald-400';
  let healthDesc = 'All systems operational';
  
  if (overview.knowledgeHealth === 'EMPTY') {
    healthDisplay = 'EMPTY';
    healthColor = 'text-white/50';
    healthDesc = 'Hermes needs knowledge';
  } else if (overview.knowledgeHealth === 'ATTENTION_REQUIRED') {
    healthDisplay = 'ATTENTION REQUIRED';
    healthColor = 'text-rose-400';
    healthDesc = 'Review failed sources';
  } else if (overview.knowledgeHealth === 'PROCESSING') {
    healthDisplay = 'PROCESSING';
    healthColor = 'text-amber-400';
    healthDesc = 'Hermes is learning';
  }

  // Count distribution
  const documents = overview.sources.filter(s => s.type === 'DOCUMENT').length;
  const faqs = overview.sources.filter(s => s.type === 'FAQ').length;
  const urls = overview.sources.filter(s => s.type === 'URL').length;
  
  const sourcesDesc = [
    documents > 0 ? `${documents} documents` : '',
    faqs > 0 ? `${faqs} FAQs` : '',
    urls > 0 ? `${urls} URLs` : ''
  ].filter(Boolean).join(' · ') || 'No sources';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Health Card */}
      <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
        <span className="text-white/60 text-xs font-mono uppercase tracking-wider">Knowledge Health</span>
        <div className={`text-lg font-medium ${healthColor} flex items-center gap-2`}>
          {healthDisplay !== 'EMPTY' && <div className={`w-1.5 h-1.5 rounded-full ${healthColor.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />}
          {healthDisplay}
        </div>
        <span className="text-white/40 text-sm">{healthDesc}</span>
      </div>

      {/* Sources Card */}
      <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
        <span className="text-white/60 text-xs font-mono uppercase tracking-wider">Sources</span>
        <div className="text-2xl font-light text-white">{overview.totalSources}</div>
        <span className="text-white/40 text-sm line-clamp-1">{sourcesDesc}</span>
      </div>

      {/* Business Entities Card */}
      <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
        <span className="text-white/60 text-xs font-mono uppercase tracking-wider">Business Entities</span>
        <div className="text-2xl font-light text-white">{overview.facts.filter(f => ['DOMAIN', 'IDENTITY', 'business_info'].includes(f.dimension)).length || '—'}</div>
        <span className="text-white/40 text-sm">Semantic mappings</span>
      </div>

      {/* Verified Knowledge Card */}
      <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
        <span className="text-white/60 text-xs font-mono uppercase tracking-wider">Verified Knowledge</span>
        <div className="text-2xl font-light text-white">{overview.facts.length || '—'}</div>
        <span className="text-white/40 text-sm">Indexed facts</span>
      </div>
    </div>
  );
}
