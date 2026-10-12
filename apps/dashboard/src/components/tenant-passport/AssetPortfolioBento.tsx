'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, BadgeCheck, Fingerprint, Globe, KeyRound, Loader2, Lock, WifiOff } from 'lucide-react';
import type { AssetBlock, PassportAsset, PassportAssetKind } from './passport-view';

const KIND_ICONS: Record<PassportAssetKind, React.ReactNode> = {
  certificate: <Award className="h-4 w-4 text-amber-300" />,
  membership: <BadgeCheck className="h-4 w-4 text-emerald-300" />,
  ownership: <KeyRound className="h-4 w-4 text-violet-300" />,
  benefit: <Fingerprint className="h-4 w-4 text-sky-300" />,
  participation: <Globe className="h-4 w-4 text-indigo-300" />,
};

const STATUS_STYLES: Record<string, string> = {
  active: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  pending: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  expired: 'border-zinc-500/25 bg-zinc-500/10 text-zinc-400',
  unknown: 'border-white/10 bg-white/5 text-zinc-400',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  expired: 'Vencido',
  unknown: 'Sin estado',
};

function BlockStateNotice({ state, message }: { state: string; message?: string }) {
  const copy =
    message ||
    ({
      loading: 'Consultando tus activos…',
      empty: 'Aún no tienes activos registrados en este tenant.',
      unavailable: 'No pudimos consultar tus activos en este momento. Inténtalo más tarde.',
      restricted: 'No tienes acceso de lectura a este bloque.',
    } as Record<string, string | undefined>)[state];

  return (
    <div className="flex h-full min-h-32 items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-zinc-400">
      {state === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
      {state === 'unavailable' && <WifiOff className="h-4 w-4 text-zinc-500" />}
      {state === 'restricted' && <Lock className="h-4 w-4 text-zinc-500" />}
      <span>{copy}</span>
    </div>
  );
}

export function AssetPortfolioBento({ block }: { block: AssetBlock }) {
  if (block.state !== 'available' || !block.assets?.length) {
    const fallbackState = block.state === 'available' ? 'empty' : block.state;
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Sovereign Asset Vault
        </h2>
        <BlockStateNotice state={fallbackState} message={block.message} />
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
        Sovereign Asset Vault
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {block.assets.map((asset: PassportAsset, i: number) => (
          <motion.article
            key={asset.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3) }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 backdrop-blur-sm"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl transition group-hover:bg-violet-500/20"
            />
            <div className="mb-3 flex items-center gap-2">
              {KIND_ICONS[asset.kind]}
              <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                {asset.kind}
              </span>
            </div>
            <p className="mb-1 text-[15px] font-medium leading-snug">{asset.title}</p>
            {asset.detail && <p className="text-xs text-zinc-500">{asset.detail}</p>}
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] ${STATUS_STYLES[asset.status] || STATUS_STYLES.unknown}`}
              >
                {STATUS_LABELS[asset.status] || STATUS_LABELS.unknown}
              </span>
              {asset.explorerUrl && (
                <a
                  href={asset.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-300 underline-offset-4 hover:underline"
                >
                  Ver evidencia IPFS
                </a>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}