'use client';

import React from 'react';

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
  pulse: boolean;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  draft: { 
    label: 'Draft', 
    bg: 'bg-zinc-500/10', 
    text: 'text-zinc-400', 
    dot: 'bg-zinc-500', 
    pulse: false 
  },
  pending: { 
    label: 'En Validación', 
    bg: 'bg-yellow-500/10', 
    text: 'text-yellow-500', 
    dot: 'bg-yellow-500', 
    pulse: true 
  },
  approved: { 
    label: 'Aprobado', 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-500', 
    dot: 'bg-blue-500', 
    pulse: true 
  },
  live: { 
    label: 'Live', 
    bg: 'bg-lime-500/10', 
    text: 'text-lime-500', 
    dot: 'bg-lime-500', 
    pulse: false 
  },
  active_client: { 
    label: 'Cliente Activo', 
    bg: 'bg-purple-500/10', 
    text: 'text-purple-500', 
    dot: 'bg-purple-500', 
    pulse: true 
  },
};

export const StatusTag = ({ status }: { status: string }) => {
  const s = status?.toLowerCase() || 'draft';
  const current = STATUS_CONFIGS[s] || STATUS_CONFIGS.draft;

  // Manual border mapping to avoid dynamic class issues in Tailwind
  const borderClass = {
    draft: 'border-zinc-500/20',
    pending: 'border-yellow-500/20',
    approved: 'border-blue-500/20',
    live: 'border-lime-500/20',
    active_client: 'border-purple-500/20',
  }[s] || 'border-zinc-500/20';

  if (!current) return null; // Extra safety for TS

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${borderClass} ${current.bg} backdrop-blur-sm self-center`}>
      <span className="relative flex h-2 w-2">
        {current.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${current.dot} opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`}></span>
      </span>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${current.text}`}>
        {current.label}
      </span>
    </div>
  );
};

export const StatusAlert = ({ status }: { status: string }) => {
  const s = status?.toLowerCase() || 'draft';
  if (s === 'live') return null;

  const messages: Record<string, string> = {
    draft: "Este proyecto es un borrador. El acceso y los artefactos no están disponibles todavía.",
    pending: "Este proyecto está en proceso de validación por Pandoras. El acceso y los artefactos estarán disponibles próximamente.",
    approved: "Este proyecto ha sido aprobado y se está preparando para su lanzamiento Live.",
    active_client: "Este proyecto es un cliente activo en fase de integración.",
  };

  const message = messages[s] || "Este proyecto no está en fase Live todavía.";

  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="mt-0.5 text-amber-500 flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm text-amber-200/80 leading-relaxed font-medium">
        {message}
      </p>
    </div>
  );
};
