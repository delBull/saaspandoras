'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Info,
} from 'lucide-react';
import type { EcosystemSetupSummary } from '@saasfly/shared';

interface TrialReadinessBannerProps {
  organizationSlug: string;
  organizationName?: string;
  currentVertical: 'HERMES' | 'GROWTH_OS' | 'PANDORAS_RWA';
  initialSummary?: EcosystemSetupSummary | null;
}

export function TrialReadinessBanner({
  organizationSlug,
  currentVertical,
  initialSummary,
}: TrialReadinessBannerProps) {
  const [summary, setSummary] = useState<EcosystemSetupSummary | null>(initialSummary ?? null);
  const [isLoading, setIsLoading] = useState(!initialSummary);

  useEffect(() => {
    let isMounted = true;
    async function loadProgress() {
      try {
        const res = await fetch(`/api/v1/internal/mesh/setup-progress/${organizationSlug}`);
        if (res.ok) {
          const data = (await res.json()) as EcosystemSetupSummary;
          if (isMounted) setSummary(data);
        }
      } catch {
        // Quiet fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProgress();
    return () => {
      isMounted = false;
    };
  }, [organizationSlug]);

  if (isLoading || !summary) return null;

  // Only render for trials
  if (!summary.isTrial) return null;

  const currentMod = summary.modules?.find((m) => m.productKey === currentVertical);
  const isPending = summary.trialStatus === 'PENDING_ACTIVATION' || summary.trialStatus === 'READY_TO_ACTIVATE';
  const isReady = summary.isReadyToActivate || (currentMod?.isReadyToActivate ?? false);

  const hubUrl = `/ecosystem/${organizationSlug}?tab=activation`;

  // Case 1: Trial is pending and ready to activate!
  if (isPending && isReady) {
    return (
      <div className="w-full bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-amber-950/50 border-b border-emerald-500/30 px-4 sm:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg z-30 animate-fadeIn">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-500/20 animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ¡Información Lista para Activar!
              </span>
              <span className="text-xs text-zinc-300 font-semibold">
                Has alcanzado el progreso necesario para iniciar tu prueba gratuita.
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              La inyección de información no tuvo costo ni consumió recursos. Al activar en el Hub Central iniciará tu periodo de <strong className="text-white">3 días (72h) de prueba gratuita</strong>.
            </p>
          </div>
        </div>

        <Link
          href={hubUrl}
          className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-black" />
          <span>Activar Prueba en Hub Central</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Case 2: Trial is pending but NOT ready yet (still injecting knowledge/config)
  if (isPending && !isReady) {
    return (
      <div className="w-full bg-[#09090E]/90 border-b border-white/10 px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs z-30">
        <div className="flex items-center gap-2.5 text-zinc-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong className="text-white">Inyección de Información Activa:</strong> Carga documentos, define tus prospectos y configura tu vertical. <span className="text-zinc-400">El tiempo de los 3 días de prueba NO comenzará a correr hasta que la actives manualmente.</span>
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono text-zinc-400">
            Readiness: <strong className="text-white">{summary.overallPercentage}%</strong>
          </span>
          <Link
            href={`/ecosystem/${organizationSlug}`}
            className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2"
          >
            <span>Ver Requisitos</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
