'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Sparkles,
  Vote,
  Gift,
} from 'lucide-react';
import type { PerksBlock, RewardsBlock } from './passport-view';

interface PerksAndClaimsCardProps {
  rewardsBlock: RewardsBlock;
  perksBlock: PerksBlock;
}

export function PerksAndClaimsCard({
  rewardsBlock,
  perksBlock,
}: PerksAndClaimsCardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Card de Recompensas y Rendimientos */}
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 backdrop-blur-md"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-2 text-emerald-300">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Rendimientos & Recompensas
              </p>
              <h3 className="text-base font-semibold text-white">Balance Reclamable</h3>
            </div>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {rewardsBlock.state === 'available' ? 'Sincronizado' : 'En espera'}
          </span>
        </div>

        {rewardsBlock.state === 'restricted' || rewardsBlock.state === 'unavailable' ? (
          <div className="mb-6 rounded-2xl border border-white/5 bg-black/30 p-5">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              {rewardsBlock.state === 'restricted' ? <Lock className="h-4 w-4 text-zinc-500" /> : <Coins className="h-4 w-4 text-zinc-500" />}
              <span>
                {rewardsBlock.message ||
                  (rewardsBlock.state === 'restricted'
                    ? 'Recompensas no visibles para esta wallet en este tenant.'
                    : 'Recompensas no disponibles en este momento.')}
              </span>
            </div>
          </div>
        ) : (
        <>
        <div className="mb-6 rounded-2xl border border-white/5 bg-black/30 p-5">
          <p className="text-xs text-zinc-400">Utilidades acumuladas en wallet</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {rewardsBlock.rewardsDisplay || '0.00 USDC'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 text-xs text-zinc-400">
            <Vote className="h-4 w-4 text-violet-400" />
            <span>Poder de voto DAO:</span>
            <strong className="text-zinc-200">
              {rewardsBlock.votingPower
                ? `${rewardsBlock.votingPower.toLocaleString()} votos`
                : '0 votos'}
            </strong>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            {rewardsBlock.claimWired
              ? rewardsBlock.canClaim
                ? 'Tienes dividendos disponibles para ser retirados directamente a tu wallet.'
                : 'Los rendimientos se acreditan automáticamente tras los cierres periódicos del tenant.'
              : 'El canje de rendimientos se habilitará cuando la liquidación activa del tenant esté operativa (Fase 3).'}
          </p>

          <button
            type="button"
            disabled={true}
            className={
              'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ' +
              (rewardsBlock.claimWired && rewardsBlock.canClaim
                ? 'bg-emerald-400 text-black hover:bg-emerald-300 active:scale-[0.98]'
                : 'cursor-not-allowed border border-white/10 bg-white/5 text-zinc-500')
            }
          >
            <span>{rewardsBlock.claimWired && rewardsBlock.canClaim ? 'Reclamar' : 'Próximamente'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {rewardsBlock.scopeNote && rewardsBlock.state === 'available' && (
          <p className="mt-3 text-[11px] text-zinc-600">{rewardsBlock.scopeNote}</p>
        )}
        </>
        )}
      </motion.article>

      {/* 2. Card de Beneficios y Utilidades (Perks) */}
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 backdrop-blur-md"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl"
        />

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-2 text-violet-300">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Privilegios de Membresía
              </p>
              <h3 className="text-base font-semibold text-white">
                Tier: {perksBlock.currentTier || 'Titular'}
              </h3>
            </div>
          </div>
          {perksBlock.nextTier && (
            <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
              Siguiente: {perksBlock.nextTier}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {(perksBlock.perks || []).slice(0, 4).map((perk) => (
            <div
              key={perk.id}
              className={`flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                perk.unlocked
                  ? 'border-white/10 bg-white/[0.04]'
                  : 'border-white/5 bg-white/[0.01] opacity-60'
              }`}
            >
              <div className="mt-0.5">
                {perk.unlocked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 text-zinc-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs font-semibold ${
                      perk.unlocked ? 'text-zinc-100' : 'text-zinc-400'
                    }`}
                  >
                    {perk.title}
                  </p>
                  {perk.badge && (
                    <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
                      {perk.badge}
                    </span>
                  )}
                </div>
                {perk.description && (
                  <p className="mt-0.5 text-[11px] text-zinc-400 leading-snug">
                    {perk.description}
                  </p>
                )}
              </div>
            </div>
          ))}

          {(!perksBlock.perks || perksBlock.perks.length === 0) && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center text-xs text-zinc-500">
              {perksBlock.message || 'No hay beneficios configurados para este nivel todavía.'}
            </div>
          )}
        </div>
      </motion.article>
    </div>
  );
}
