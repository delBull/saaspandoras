'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Copy, ExternalLink, CheckCircle2, Clock, XCircle,
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';

interface Issuance {
  id: string;
  recipientWallet: string;
  tokenId: string | null;
  mintTxHash: string | null;
  mintedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  status: 'pending_mint' | 'minted' | 'mint_failed' | 'revoked' | 'expired';
  isExpired: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  status: string;
  contractAddress: string | null;
  chainId: number;
  standard: string;
}

interface IssuancesPanelProps {
  collectionId: string;
  organizationSlug: string;
  apiKey: string;
}

const STATUS_CONFIG = {
  minted: { label: 'Minted', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  pending_mint: { label: 'Pendiente', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  mint_failed: { label: 'Falló', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  revoked: { label: 'Revocado', icon: XCircle, color: 'text-zinc-500', bg: 'bg-zinc-500/10 border-zinc-500/20' },
  expired: { label: 'Expirado', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
};

function truncateAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function getExplorerUrl(txHash: string, chainId: number) {
  const explorers: Record<number, string> = {
    8453: 'https://basescan.org/tx/',
    84532: 'https://sepolia.basescan.org/tx/',
    11155111: 'https://sepolia.etherscan.io/tx/',
  };
  return `${explorers[chainId] || 'https://etherscan.io/tx/'}${txHash}`;
}

export function IssuancesPanel({ collectionId, organizationSlug, apiKey }: IssuancesPanelProps) {
  const [data, setData] = useState<{ collection: Collection; issuances: Issuance[]; pagination: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchIssuances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(
        `/api/v1/growth/nft-lab/collections/${collectionId}/issuances?${params}`,
        { headers: { 'x-api-key': apiKey } }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [collectionId, page, statusFilter, apiKey]);

  useEffect(() => { fetchIssuances(); }, [fetchIssuances]);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-sm font-mono">Cargando issuances…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-300 text-sm font-mono">{error}</p>
        <button onClick={fetchIssuances} className="mt-3 text-xs text-zinc-400 hover:text-white underline">
          Reintentar
        </button>
      </div>
    );
  }

  const collection = data?.collection;
  const issuances = data?.issuances ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Collection header */}
      {collection && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-white/5">
          <div className="flex-1">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Titulares — {collection.name}
              <span className="text-zinc-500 font-mono text-sm">{collection.symbol}</span>
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              {collection.contractAddress
                ? <span className="text-emerald-400">● {truncateAddress(collection.contractAddress)} · chain {collection.chainId}</span>
                : <span className="text-zinc-500">⊘ Sin desplegar</span>
              }
              &nbsp;·&nbsp;{pagination?.total ?? 0} issuances total
            </p>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-xs font-mono bg-white/5 border border-white/10 text-zinc-300 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="minted">Minted</option>
              <option value="pending_mint">Pendiente</option>
              <option value="mint_failed">Falló</option>
              <option value="revoked">Revocado</option>
            </select>
            <button
              onClick={fetchIssuances}
              disabled={loading}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Issuances table */}
      {issuances.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center">
          <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Sin issuances para este filtro.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Wallet</th>
                <th className="text-left px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hidden md:table-cell">Token ID</th>
                <th className="text-left px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Minted At</th>
                <th className="text-left px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Expira</th>
                <th className="px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hidden md:table-cell">Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {issuances.map((issuance) => {
                const statusConfig = (STATUS_CONFIG as any)[
                  issuance.isExpired && issuance.status === 'minted' ? 'expired' : issuance.status
                ] || STATUS_CONFIG.pending_mint;
                const StatusIcon = statusConfig.icon;

                return (
                  <tr
                    key={issuance.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Wallet */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-300 group-hover:text-white transition-colors">
                          {truncateAddress(issuance.recipientWallet)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(issuance.recipientWallet, `wallet-${issuance.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedId === `wallet-${issuance.id}`
                            ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            : <Copy className="w-3 h-3 text-zinc-500 hover:text-white" />
                          }
                        </button>
                      </div>
                    </td>

                    {/* Token ID */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-zinc-500">
                        {issuance.tokenId ? `#${issuance.tokenId}` : '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Minted At */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-mono text-zinc-500">
                        {issuance.mintedAt
                          ? new Date(issuance.mintedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
                          : '—'
                        }
                      </span>
                    </td>

                    {/* Expires At */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-mono ${issuance.isExpired ? 'text-orange-400' : 'text-zinc-500'}`}>
                        {issuance.expiresAt
                          ? new Date(issuance.expiresAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
                          : <span className="text-zinc-600">∞</span>
                        }
                      </span>
                    </td>

                    {/* Tx link */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {issuance.mintTxHash && collection?.contractAddress ? (
                        <a
                          href={getExplorerUrl(issuance.mintTxHash, collection.chainId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500">
            {pagination.total} issuances · página {pagination.page} de {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
