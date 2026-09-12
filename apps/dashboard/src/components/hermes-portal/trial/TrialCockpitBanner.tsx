'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Zap,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  FileText,
  Target,
  AlertCircle,
} from 'lucide-react';
import type { PortalTrialContext } from '@/lib/portal/portal-types';
import { TrialUpgradeModal } from './TrialUpgradeModal';

interface TrialCockpitBannerProps {
  trial: PortalTrialContext;
  organizationSlug: string;
  organizationName: string;
}

export function TrialCockpitBanner({
  trial,
  organizationSlug,
  organizationName,
}: TrialCockpitBannerProps) {
  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(Boolean(trial.isExpired));
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [liveQuotas, setLiveQuotas] = useState<{
    mediaCredits?: { granted: number; consumed: number; remaining: number };
    knowledgeCount?: number;
    campaignsCount?: number;
  }>({});

  // Real-time countdown
  useEffect(() => {
    const target = trial.endsAt
      ? new Date(trial.endsAt).getTime()
      : Date.now() + 72 * 3600 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemainingStr('EXPIRADO (72h Concluidas)');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemainingStr(`${hours}h ${minutes}m ${seconds}s restantes`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [trial.endsAt]);

  // Fetch live trial context stats
  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const res = await fetch(`/api/v1/hermes/trial/context?tenantId=${organizationSlug}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.ok) {
            setLiveQuotas({
              mediaCredits: data.mediaCredits,
              knowledgeCount: data.quotas?.knowledge?.current,
              campaignsCount: data.quotas?.campaigns?.current,
            });
          }
        }
      } catch (err) {
        // quiet fallback
      }
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [organizationSlug]);

  return (
    <>
      <div
        className={`w-full border-b px-4 sm:px-6 py-2.5 transition-all text-xs flex flex-wrap items-center justify-between gap-3 ${
          isExpired
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            : 'bg-[#0B0B14] border-purple-500/20 text-zinc-300'
        }`}
      >
        {/* Left Side: Status & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono font-semibold">
            {isExpired ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>MODO PRESERVED (SOLO LECTURA)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px]">
                <Clock className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                <span>{timeRemainingStr || 'Calculando...'}</span>
              </span>
            )}
          </div>

          <span className="hidden lg:inline text-[11px] text-zinc-400 font-light">
            {isExpired
              ? 'Las mutaciones están bloqueadas. Todos tus datos y documentos están protegidos.'
              : 'Tenant Soberano temporal de 72 horas gobernado por Pandoras OS.'}
          </span>
        </div>

        {/* Middle: Quotas badges */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
          {liveQuotas.mediaCredits && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-zinc-300">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>
                {liveQuotas.mediaCredits.remaining}/{liveQuotas.mediaCredits.granted} Media
              </span>
            </div>
          )}

          {typeof liveQuotas.knowledgeCount === 'number' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-zinc-300">
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>{liveQuotas.knowledgeCount}/5 Docs</span>
            </div>
          )}

          {typeof liveQuotas.campaignsCount === 'number' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-zinc-300">
              <Target className="w-3 h-3 text-emerald-400" />
              <span>{liveQuotas.campaignsCount}/3 Campañas</span>
            </div>
          )}
        </div>

        {/* Right Side: CTA Upgrade */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUpgradeOpen(true)}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isExpired
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-amber-500/20'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isExpired ? 'Reactivar en Producción' : 'Adquirir Plan / Upgrade'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <TrialUpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        organizationSlug={organizationSlug}
        organizationName={organizationName}
      />
    </>
  );
}
