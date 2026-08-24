'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, FileText, Globe, MessageCircle, Building2, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import type { KnowledgeSourceView } from '@/lib/pandoras/core/domains/control-plane/view-models';

const COLLAPSED_VISIBLE_COUNT = 4;

export function KnowledgeSourcesPanel({
  sources,
  onViewSource,
  onTeachClick
}: {
  sources: KnowledgeSourceView[],
  onViewSource?: (id: string) => void,
  onTeachClick: () => void
}) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setExpanded(window.matchMedia('(min-width: 640px)').matches);
  }, []);

  const isCollapsible = sources.length > COLLAPSED_VISIBLE_COUNT;
  const visibleSources = expanded ? sources : sources.slice(0, COLLAPSED_VISIBLE_COUNT);

  return (
    <div className="flex flex-col border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xl text-white/90 font-medium tracking-tight">KNOWLEDGE SOURCES</h2>
      </div>

      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-xl text-white/80 mb-2">Hermes is ready to learn</h3>
          <p className="text-white/50 max-w-md mb-6">
            Your business knowledge is what allows Hermes to understand your customers, products, and operation.
          </p>
          <button
            onClick={onTeachClick}
            className="px-6 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
          >
            Start Teaching
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/5">
          {visibleSources.map(source => (
            <KnowledgeSourceRow key={source.id} source={source} onClick={() => onViewSource?.(source.id)} />
          ))}

          {isCollapsible && (
            <button
              className="p-3.5 min-h-[44px] flex items-center justify-center gap-1.5 text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:bg-white/[0.02] transition-colors bg-white/[0.01]"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? 'Mostrar menos' : `Ver todas las fuentes (${sources.length})`}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}

          <button
            className="p-4 text-center text-sm text-white/40 hover:text-white/60 transition-colors bg-white/[0.01]"
            onClick={onTeachClick}
          >
            View all →
          </button>
        </div>
      )}
    </div>
  );
}

function KnowledgeSourceRow({ source, onClick }: { source: KnowledgeSourceView, onClick: () => void }) {
  const getIcon = () => {
    switch(source.type) {
      case 'DOCUMENT': return <FileText className="w-5 h-5" />;
      case 'URL': return <Globe className="w-5 h-5" />;
      case 'FAQ': return <MessageCircle className="w-5 h-5" />;
      case 'BUSINESS_INFO': return <Building2 className="w-5 h-5" />;
      case 'BUSINESS_RULE': return <ShieldAlert className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusDisplay = () => {
    switch (source.status) {
      case 'READY':
        return (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            READY
          </div>
        );
      case 'PROCESSING':
      case 'CREATED':
        return (
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            PROCESSING
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            ATTENTION REQUIRED
          </div>
        );
    }
  };

  return (
    <motion.button
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
      onClick={onClick}
      className="flex items-center justify-between p-4 text-left group transition-all w-full min-w-0 overflow-hidden gap-4"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
        <div className="text-white/50 group-hover:text-white/80 transition-colors shrink-0">
          {getIcon()}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-white/90 font-medium mb-1 truncate text-sm">{source.title}</div>
          <div className="text-white/50 text-xs">
            {source.type.replace('_', ' ')} · v{source.version}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          {getStatusDisplay()}
          <div className="text-white/30 text-xs mt-1">
            Updated {source.lastUpdated ? new Date(source.lastUpdated).toLocaleDateString() : 'Just now'}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors shrink-0" />
      </div>
    </motion.button>
  );
}
