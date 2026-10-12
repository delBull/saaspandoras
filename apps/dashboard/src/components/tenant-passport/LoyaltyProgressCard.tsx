'use client';

import React from 'react';
import { useGamification } from '@pandoras/gamification';
import { Loader2, Sparkles, WifiOff } from 'lucide-react';
import type { LoyaltyBlock } from './passport-view';

const TIERS: Array<{ key: string; label: string; xp: number }> = [
  { key: 'explorer', label: 'Explorer', xp: 0 },
  { key: 'backer', label: 'Backer', xp: 500 },
  { key: 'patron', label: 'Patron', xp: 2000 },
  { key: 'sovereign', label: 'Sovereign Insider', xp: 5000 },
];

function resolveTier(xp: number) {
  let current = TIERS[0]!;
  for (const tier of TIERS) {
    if (xp >= tier.xp) current = tier;
  }
  const next = TIERS[TIERS.indexOf(current) + 1] || null;
  const progress = next
    ? Math.min(100, Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100))
    : 100;
  return { current, next, progress };
}

export function LoyaltyProgressCard({ block }: { block: LoyaltyBlock }) {
  if (block.state === 'loading' || block.state === 'unavailable' || block.state === 'restricted') {
    const copy =
      block.state === 'loading'
        ? 'Consultando tu nivel de lealtad…'
        : block.message || 'Panel de lealtad no disponible en este momento.';
    return (
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-amber-300" />
          Lealtad &amp; Progreso
        </h3>
        <div
          className={`flex items-center gap-2 text-sm text-zinc-400 ${block.state === 'loading' ? '' : 'h-full'}`}
        >
          {block.state === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {block.state !== 'loading' && <WifiOff className="h-4 w-4" />}
          <span>{copy}</span>
        </div>
      </section>
    );
  }

  return (
    <LoyaltyProgressCardClient userId={block.userId} />
  );
}

function LoyaltyProgressCardClient({ userId }: { userId: string }) {
  const { profile, isLoading, error } = useGamification({ userId, autoRefresh: false });

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-amber-300" />
          Lealtad &amp; Progreso
        </h3>
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Consultando tu nivel de lealtad…
        </p>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-amber-300" />
          Lealtad &amp; Progreso
        </h3>
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
          <WifiOff className="h-4 w-4" />
          El motor de lealtad aún no está activo para tu cuenta.
        </p>
      </section>
    );
  }

  const xp = typeof profile.totalPoints === 'number' ? profile.totalPoints : 0;
  const tier = resolveTier(xp);
  const levelProgress =
    typeof profile.levelProgress === 'number' && profile.levelProgress >= 0 && profile.levelProgress <= 100
      ? Math.round(profile.levelProgress)
      : tier.progress;

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-amber-300" />
        Lealtad &amp; Progreso
      </h3>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Nivel actual</p>
          <p className="text-[15px] font-semibold text-zinc-100">
            Nivel {profile.currentLevel} · {tier.current.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">XP acumulada</p>
          <p className="text-lg font-semibold tabular-nums text-amber-300">{xp.toLocaleString('es-MX')}</p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-700"
          style={{ width: `${levelProgress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {tier.next
          ? profile.pointsToNextLevel
            ? `${profile.pointsToNextLevel.toLocaleString('es-MX')} XP para ${tier.next.label}`
            : `${(tier.next.xp - xp).toLocaleString('es-MX')} XP para ${tier.next.label}`
          : 'Has alcanzado el nivel máximo. ¡Bienvenido al Sovereign Insider!'}
      </p>
      <p className="mt-3 text-[11px] text-zinc-600">
        La XP es una métrica de participación; no otorga permisos administrativos.
      </p>
    </section>
  );
}