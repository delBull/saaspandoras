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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Sovereign Asset Vault
          </h2>
        </div>
        <BlockStateNotice state={fallbackState} message={block.message} />
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Sovereign Asset Vault
          </h2>
          <p className="text-xs text-zinc-400">
            Títulos, certificados notarizados y derechos de propiedad registrados.
          </p>
        </div>
        {block.totalUnits !== undefined && block.totalUnits > 0 && (
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            <span className="text-zinc-400">Tenencia total:</span>
            <strong className="text-white">{block.totalUnits} unidades</strong>
            {block.totalValueUsd !== undefined && (
              <span className="text-emerald-400 font-medium">
                · ${block.totalValueUsd.toLocaleString()} USD
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {block.assets.map((asset: PassportAsset, i: number) => {
          const isFeatured = asset.kind === 'ownership';
          return (
            <motion.article
              key={asset.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3) }}
              className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 hover:border-white/20 ${
                isFeatured
                  ? 'sm:col-span-2 border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-white/[0.04] to-white/[0.02]'
                  : 'border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02]'
              }`}
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-3xl transition ${
                  isFeatured
                    ? 'bg-violet-500/25 group-hover:bg-violet-500/35'
                    : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
                }`}
              />

              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {KIND_ICONS[asset.kind]}
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    {asset.kind === 'certificate'
                      ? 'Certificado'
                      : asset.kind === 'membership'
                        ? 'Membresía'
                        : asset.kind === 'ownership'
                          ? 'Título Global'
                          : asset.kind}
                  </span>
                </div>
                {asset.badge && (
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                    {asset.badge}
                  </span>
                )}
              </div>

              <p className="mb-1 text-base font-semibold leading-snug text-white">
                {asset.title}
              </p>
              {asset.detail && (
                <p className="text-xs text-zinc-400 font-medium">{asset.detail}</p>
              )}

              {asset.agreementHash && (
                <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                  <span>HASH:</span>
                  <span className="truncate max-w-[200px] text-zinc-400">
                    {asset.agreementHash}
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                    STATUS_STYLES[asset.status] || STATUS_STYLES.unknown
                  }`}
                >
                  {STATUS_LABELS[asset.status] || STATUS_LABELS.unknown}
                </span>

                {(asset.legalPortalUrl || asset.explorerUrl) && (
                  <a
                    href={asset.legalPortalUrl || asset.explorerUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 underline-offset-4 hover:underline"
                  >
                    <span>Ver Certificado Notarizado</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}