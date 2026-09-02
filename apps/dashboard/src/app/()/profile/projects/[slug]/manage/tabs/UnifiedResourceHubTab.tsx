'use client';

/**
 * UnifiedResourceHubTab — Central Hub de Recursos & Knowledge Center
 * apps/dashboard/src/app/()/profile/projects/[slug]/manage/tabs/UnifiedResourceHubTab.tsx
 *
 * Divides the resource center into two clean internal tabs:
 * 1. Documentos & Shortlinks (Archivos, enlaces pbox.dev, comunidad)
 * 2. Knowledge Center (Materiales, Briefings, Dossier, Deck, Whitepaper & Brand Prompts)
 */

import React, { useState } from 'react';
import { ResourceHubTab } from './ResourceHubTab';
import { KnowledgeCenterTab } from '@/components/shared/tabs/KnowledgeCenterTab';
import { Folder, FileText, Sparkles, Share2 } from 'lucide-react';

interface UnifiedResourceHubTabProps {
  project: any;
}

export function UnifiedResourceHubTab({ project }: UnifiedResourceHubTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'docs' | 'knowledge'>('docs');

  return (
    <div className="space-y-6">
      {/* ── TOP SWITCHER TABS ── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-3">
        <div className="flex items-center gap-2 p-1 bg-black/50 border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'docs'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Documentos & Shortlinks</span>
          </button>

          <button
            onClick={() => setActiveSubTab('knowledge')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'knowledge'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Knowledge Center (Materiales & Briefings)</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-500">
          {activeSubTab === 'docs'
            ? 'Repositorio de archivos públicos y redirecciones'
            : 'Contenido editorial, briefing institucional y kits de marca'}
        </span>
      </div>

      {/* ── TAB CONTENT ── */}
      {activeSubTab === 'docs' && (
        <div>
          <ResourceHubTab project={project} />
        </div>
      )}

      {activeSubTab === 'knowledge' && (
        <div>
          <KnowledgeCenterTab project={project} />
        </div>
      )}
    </div>
  );
}
