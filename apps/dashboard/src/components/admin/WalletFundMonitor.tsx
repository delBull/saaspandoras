'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface WalletData {
  label: string;
  address: string;
  description: string;
  icon: string;
  balanceEth: number | null;
  status: 'optimal' | 'warning' | 'critical' | 'error';
  thresholds: { optimal: number; warning: number };
}

interface WalletBalancesResponse {
  wallets: WalletData[];
  checkedAt: string;
}

function StatusBar({ balance, thresholds }: { balance: number; thresholds: { optimal: number; warning: number } }) {
  const { optimal, warning } = thresholds;
  // Clamp the display max at 3x optimal for a reasonable bar
  const displayMax = optimal * 3;
  const pct = Math.min((balance / displayMax) * 100, 100);
  const isOptimal = balance >= optimal;
  const isWarning = !isOptimal && balance >= warning;

  const barColor = isOptimal
    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
    : isWarning
    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse';

  const bgColor = isOptimal ? 'bg-emerald-500/10' : isWarning ? 'bg-amber-400/10' : 'bg-red-500/10';

  return (
    <div className={`h-2 w-full rounded-full ${bgColor} overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: WalletData['status'] }) {
  const map = {
    optimal: { label: 'Óptimo', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    warning: { label: 'Bajo', cls: 'bg-amber-400/15 text-amber-400 border-amber-500/30' },
    critical: { label: 'Crítico', cls: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse' },
    error: { label: 'Error', cls: 'bg-zinc-700/50 text-zinc-500 border-zinc-700' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

export function WalletFundMonitor() {
  const [data, setData] = useState<WalletBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetch_ = useCallback(async (withAlert = false) => {
    try {
      const url = withAlert
        ? '/api/admin/wallet-balances?alert=true'
        : '/api/admin/wallet-balances';
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const json: WalletBalancesResponse = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    // Refresh every 5 minutes
    const id = setInterval(() => fetch_(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetch_]);

  const handleSendAlert = async () => {
    setSending(true);
    await fetch_(true);
    setSending(false);
    toast.success('Chequeo completo. Las wallets en alerta han sido notificadas a Discord.');
  };

  const anyWarning = data?.wallets.some(w => w.status === 'warning');
  const anyCritical = data?.wallets.some(w => w.status === 'critical');

  const headerBorder = anyCritical
    ? 'border-red-500/40 bg-red-500/5'
    : anyWarning
    ? 'border-amber-500/30 bg-amber-500/5'
    : 'border-zinc-800 bg-zinc-900/40';

  return (
    <div className={`rounded-2xl border ${headerBorder} transition-all duration-300 overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-3 group"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${anyCritical ? 'bg-red-500/15 text-red-400' : anyWarning ? 'bg-amber-400/15 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Monitor de Fondos Operacionales
              {anyCritical && <span className="text-[10px] font-black text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse">⚠ CRÍTICO</span>}
              {!anyCritical && anyWarning && <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">⚡ ALERTA</span>}
            </h3>
            <p className="text-[11px] text-zinc-500">Wallets operacionales en Base Mainnet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-[10px] text-zinc-600 hidden sm:block">
              Actualizado {new Date(data.checkedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${collapsed ? '-rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5">
          {loading ? (
            <div className="pt-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data?.wallets.map((wallet) => (
                  <div
                    key={wallet.address}
                    className={`rounded-xl border p-4 space-y-3 transition-all ${
                      wallet.status === 'critical'
                        ? 'border-red-500/30 bg-red-500/5'
                        : wallet.status === 'warning'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : 'border-zinc-800 bg-zinc-900/60'
                    }`}
                  >
                    {/* Wallet header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{wallet.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{wallet.label}</p>
                          <p className="text-[10px] text-zinc-500">{wallet.description}</p>
                        </div>
                      </div>
                      <StatusBadge status={wallet.status} />
                    </div>

                    {/* Balance */}
                    <div>
                      {wallet.balanceEth !== null ? (
                        <>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className={`text-base font-black font-mono ${
                              wallet.status === 'critical' ? 'text-red-400' :
                              wallet.status === 'warning' ? 'text-amber-400' :
                              'text-emerald-400'
                            }`}>
                              {wallet.balanceEth.toFixed(5)} ETH
                            </span>
                            <span className="text-[10px] text-zinc-600 font-mono">
                              min {wallet.thresholds.warning} ETH
                            </span>
                          </div>
                          <StatusBar balance={wallet.balanceEth} thresholds={wallet.thresholds} />
                        </>
                      ) : (
                        <p className="text-xs text-zinc-600 italic">No se pudo leer el balance</p>
                      )}
                    </div>

                    {/* Address */}
                    <p className="text-[10px] text-zinc-600 font-mono truncate">
                      {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ≥ {data?.wallets[0]?.thresholds.optimal} ETH</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> ≥ {data?.wallets[0]?.thresholds.warning} ETH</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {"<"} {data?.wallets[0]?.thresholds.warning} ETH</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetch_()}
                    className="text-[11px] text-zinc-500 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                    type="button"
                  >
                    ↻ Refrescar
                  </button>
                  <button
                    onClick={handleSendAlert}
                    disabled={sending}
                    className="text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    type="button"
                  >
                    {sending ? 'Enviando...' : '📣 Verificar y Notificar'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
