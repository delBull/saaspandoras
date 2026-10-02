'use client';

import { motion } from 'framer-motion';
import { BrainCircuit, BookOpen, GraduationCap, Map, TerminalSquare, ExternalLink, ArrowUpRight, Search, FileText } from 'lucide-react';
import { useState } from 'react';

export function OperationsKnowledgeTab() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-5 overflow-y-auto flex-1 space-y-6">
      {/* Architecture Lock Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.04]">
        <div>
          <p className="text-[11px] text-rose-300 font-mono uppercase font-bold flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>SOVEREIGN KNOWLEDGE VAULT (K25/IPFS)</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Interfaz operativa para la Academia, Guías Operativas y Matriz Cognitiva de Hermes.
          </p>
        </div>
        <a
          href="/admin/hermes"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0"
        >
          <TerminalSquare className="w-3.5 h-3.5" />
          <span>Hermes QA Command</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Global Knowledge Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar en la base de conocimiento, playbooks o tutoriales..."
          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-rose-500/50 transition-colors placeholder:text-zinc-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pandora's Academy */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0C0C10] flex flex-col h-full hover:border-emerald-500/30 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1.5">Pandora's Academy</h3>
          <p className="text-xs text-zinc-400 mb-4 flex-1 leading-relaxed">
            Cursos, certificaciones operativas y tracks ejecutivos para roles institucionales (COO, CMO, RWA).
          </p>
          <a
            href={process.env.NODE_ENV === 'development' ? 'http://academy.localhost:3000/console' : 'https://academy.pandoras.finance/console'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono transition-colors hover:bg-emerald-500/20"
          >
            <span>Abrir Academy Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Ecosystem Guides */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0C0C10] flex flex-col h-full hover:border-indigo-500/30 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
            <Map className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1.5">Ecosystem Guides & Tours</h3>
          <p className="text-xs text-zinc-400 mb-4 flex-1 leading-relaxed">
            Gestor narrativo de onboarding, configurador de estaciones (Sovereign Doctrine) y FAQs de Hermes.
          </p>
          <a
            href="/admin/hermes"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3.5 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono transition-colors hover:bg-indigo-500/20"
          >
            <span>Editar Ecosystem Guides</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Protocols & Runbooks */}
      <div className="mt-6">
        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4">
          Protocols & Operational Runbooks
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'RB-01', title: 'KYC/AML Compliance', category: 'Compliance', color: 'amber' },
            { id: 'RB-02', title: 'Tokenization Deal Flow', category: 'Growth', color: 'sky' },
            { id: 'RB-03', title: 'Platform Fee Sweep', category: 'Finance', color: 'purple' },
          ].map(runbook => (
            <div key={runbook.id} className="p-4 rounded-xl border border-white/10 bg-[#0C0C10] hover:border-white/20 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <FileText className={`w-4 h-4 text-${runbook.color}-400`} />
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border border-${runbook.color}-500/30 bg-${runbook.color}-500/10 text-${runbook.color}-300 uppercase`}>
                  {runbook.category}
                </span>
              </div>
              <h5 className="text-sm font-medium text-zinc-200 mt-2">{runbook.title}</h5>
              <p className="text-[10px] text-zinc-500 font-mono mt-2">ID: {runbook.id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
