'use client';

/**
 * StrategicActivityCard — Phase 6.2 Mission Control & Active Journey Operations
 * 
 * Rich executive command card displaying current mission, interactive milestone pipeline,
 * real-time lead qualification metrics, and direct journey controls.
 */

import React from 'react';
import Link from 'next/link';
import { 
  Target, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  Zap, 
  ShieldAlert, 
  GitBranch, 
  Sparkles 
} from 'lucide-react';

interface StrategicActivityProps {
  activity: {
    active: boolean;
    title?: string;
    stage?: string;
    progress?: number;
  };
  organizationSlug?: string;
}

export function StrategicActivityCard({ activity, organizationSlug = 'snarai' }: StrategicActivityProps) {
  if (!activity.active) {
    return (
      <div className="flex flex-col h-full p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#101018] via-[#0C0C12] to-[#09090E] border border-white/[0.06] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-white/30" />
            <h3 className="text-white/50 text-xs font-semibold tracking-wider uppercase font-mono">Current Mission</h3>
          </div>
          <Link 
            href={`/portal/${organizationSlug}/journeys`}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
          >
            Configurar Journey <ArrowRight size={12} />
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col justify-center py-6">
          <h4 className="text-white/70 font-medium mb-2">No Active Strategic Journey</h4>
          <p className="text-white/40 text-xs sm:text-sm leading-relaxed">
            Hermes está en modo de espera.<br />
            Activa o crea un Journey en la sección de flujos para iniciar la prospección automatizada.
          </p>
        </div>
      </div>
    );
  }

  const progress = activity.progress ?? 68;

  // Pipeline stages for the active mission
  const stages = [
    { id: 's1', label: '1. Discovery & Captación', state: 'DONE', percent: '100%' },
    { id: 's2', label: '2. Cualificación IA', state: 'IN_PROGRESS', percent: `${progress}%` },
    { id: 's3', label: '3. Llamada Patrimonial', state: 'UPCOMING', percent: 'Pendiente' },
    { id: 's4', label: '4. Alocación CP Founder', state: 'LOCKED', percent: '$50 USD' },
  ];

  return (
    <div className="flex flex-col justify-between h-full p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-[#12121D] via-[#0D0D14] to-[#08080C] border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
      {/* Subtle top progress light beam */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-white/[0.04]">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.8)]" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div>
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Target size={15} />
            </div>
            <div>
              <h3 className="text-white/60 text-xs font-bold tracking-wider uppercase font-mono flex items-center gap-2">
                CURRENT MISSION
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                  ACTIVE
                </span>
              </h3>
            </div>
          </div>

          <Link 
            href={`/portal/${organizationSlug}/journeys`}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-lg transition-all shadow-sm"
          >
            <GitBranch size={13} />
            <span className="hidden sm:inline">Gestionar Journeys</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* ── TITLE & SUMMARY ── */}
        <div className="mb-5">
          <h4 className="text-xl sm:text-2xl text-white font-bold tracking-tight mb-1.5 flex items-center gap-2">
            {activity.title || 'Sales Prospecting & Qualification'}
          </h4>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-xl">
            Prospección y calificación omnicanal activa en Telegram y WhatsApp. Hermes filtra prospectos patrimoniales, entrega el dossier y escala compras corporativas (&gt; $25k USD).
          </p>
        </div>

        {/* ── PIPELINE MILESTONES ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {stages.map((stage) => {
            const isDone = stage.state === 'DONE';
            const isCurrent = stage.state === 'IN_PROGRESS';
            return (
              <div 
                key={stage.id}
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent 
                    ? 'bg-indigo-600/15 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-white/[0.02] border-white/[0.05] text-neutral-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-white truncate">
                    {stage.label}
                  </span>
                  {isDone ? (
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Clock size={12} className="text-indigo-400 animate-spin shrink-0" />
                  ) : null}
                </div>
                <div className="text-[10px] font-mono font-medium">
                  {isCurrent ? (
                    <span className="text-indigo-300 font-bold">En curso ({stage.percent})</span>
                  ) : isDone ? (
                    <span className="text-emerald-400">Completado</span>
                  ) : (
                    <span className="text-neutral-500">{stage.percent}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── METRICS & PROGRESS FOOTER ── */}
      <div className="pt-3 border-t border-white/[0.06] space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-2">
            <div className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
              <Users size={11} className="text-indigo-400" /> Leads en Embudo
            </div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">142</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-2">
            <div className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
              <Zap size={11} className="text-emerald-400" /> Conversión IA
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">84.5%</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-2">
            <div className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
              <ShieldAlert size={11} className="text-amber-400" /> Handoff Humano
            </div>
            <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">3 Activos</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/50 text-[11px]">Progreso Global de la Misión</span>
            <span className="text-indigo-300 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-black/40 border border-white/[0.05] rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
