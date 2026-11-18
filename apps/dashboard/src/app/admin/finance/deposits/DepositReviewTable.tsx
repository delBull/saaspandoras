'use client';

import React, { useState, useTransition } from 'react';
import { approveDeposit, rejectDeposit } from './actions';

interface QueueRow {
  id: string;
  tenantId: string;
  amountUsd: number;
  txHash: string;
  chainId: number | null;
  fromAddress: string | null;
  blockNumber: string | null;
  status: string;
  note: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface RecentRow {
  id: string;
  tenantId: string;
  amountUsd: string;
  txHash: string;
  chainId: number | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

function explorer(chainId: number | null, txHash: string) {
  return chainId === 8453
    ? `https://basescan.org/tx/${txHash}`
    : `https://sepolia.basescan.org/tx/${txHash}`;
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  approved: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  credited: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
};

export function DepositReviewTable({ rows, recent }: { rows: QueueRow[]; recent: RecentRow[] }) {
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const run = (id: string, fn: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    setActiveId(id);
    setFeedback(null);
    startTransition(async () => {
      const result = await fn();
      setFeedback({
        ok: result.success,
        message: result.success ? result.message ?? 'Hecho.' : result.error ?? 'Error.',
      });
      setActiveId(null);
      if (result.success) setReason('');
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Cola de revisión</h2>
          <span className="text-xs text-zinc-400">{rows.length} pendiente(s)</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-zinc-400">No hay depósitos pendientes.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {rows.map((row) => (
              <li key={row.id} className="px-5 py-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-semibold text-white">${row.amountUsd.toFixed(2)}</span>
                  <span className="text-sm text-zinc-300">{row.tenantId}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${
                      STATUS_STYLE[row.status] ?? 'border-white/10 text-zinc-300'
                    }`}
                  >
                    {row.status}
                  </span>
                  <a
                    href={explorer(row.chainId, row.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-400 hover:underline"
                  >
                    ver en explorer ↗
                  </a>
                  <span className="ml-auto text-xs text-zinc-500">
                    {new Date(row.createdAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <dl className="grid grid-cols-1 gap-1 text-xs text-zinc-400 sm:grid-cols-2">
                  <div>
                    <dt className="inline text-zinc-500">txHash: </dt>
                    <dd className="inline break-all font-mono">{row.txHash}</dd>
                  </div>
                  <div>
                    <dt className="inline text-zinc-500">origen: </dt>
                    <dd className="inline font-mono">{row.fromAddress ?? 'desconocido'}</dd>
                  </div>
                  <div>
                    <dt className="inline text-zinc-500">bloque: </dt>
                    <dd className="inline">{row.blockNumber ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="inline text-zinc-500">chainId: </dt>
                    <dd className="inline">{row.chainId ?? '—'}</dd>
                  </div>
                  {row.note && (
                    <div className="sm:col-span-2">
                      <dt className="inline text-zinc-500">nota del tenant: </dt>
                      <dd className="inline">{row.note}</dd>
                    </div>
                  )}
                </dl>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={pending && activeId === row.id}
                    onClick={() => run(row.id, () => approveDeposit(row.id))}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                  >
                    {pending && activeId === row.id ? 'Procesando…' : 'Aprobar y acreditar'}
                  </button>

                  <input
                    type="text"
                    value={activeId === row.id ? reason : ''}
                    onChange={(e) => setReason(e.target.value)}
                    onFocus={() => setActiveId(row.id)}
                    placeholder="Motivo del rechazo"
                    className="w-56 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(row.id, () => rejectDeposit(row.id, reason))}
                    className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-medium text-white">Histórico reciente</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-400">Sin movimientos.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-zinc-400">
              <tr>
                <th className="px-5 py-2 font-medium">Fecha</th>
                <th className="px-5 py-2 font-medium">Tenant</th>
                <th className="px-5 py-2 font-medium">Importe</th>
                <th className="px-5 py-2 font-medium">Estado</th>
                <th className="px-5 py-2 font-medium">Revisado por</th>
                <th className="px-5 py-2 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {recent.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-2 text-zinc-500">
                    {new Date(row.reviewedAt ?? row.createdAt).toLocaleString('es', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-5 py-2">{row.tenantId}</td>
                  <td className="px-5 py-2">${Number(row.amountUsd).toFixed(2)}</td>
                  <td className="px-5 py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] uppercase ${
                        STATUS_STYLE[row.status] ?? 'border-white/10 text-zinc-300'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-2 font-mono text-zinc-500">{row.reviewedBy ?? '—'}</td>
                  <td className="px-5 py-2 text-zinc-500">{row.rejectionReason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
