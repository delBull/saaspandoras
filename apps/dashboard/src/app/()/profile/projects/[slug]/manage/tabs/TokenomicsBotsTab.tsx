'use client';

/**
 * TokenomicsBotsTab — Fases de Venta, Tokenomics & Telegram TMA Bots
 * apps/dashboard/src/app/()/profile/projects/[slug]/manage/tabs/TokenomicsBotsTab.tsx
 */

import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Send, Bot, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface TokenomicsBotsTabProps {
  project: any;
}

export function TokenomicsBotsTab({ project }: TokenomicsBotsTabProps) {
  const [botToken, setBotToken] = useState('');
  const [isSavingBot, setIsSavingBot] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string | null>(null);

  // Parse project config
  let config: any = {};
  try {
    config = typeof project.w2eConfig === 'string' ? JSON.parse(project.w2eConfig) : project.w2eConfig || {};
  } catch (e) {
    console.error('Error parsing w2eConfig', e);
  }

  const phases = config.phases || [];

  const handleTogglePhase = async (phaseId: string, currentStatus: boolean) => {
    try {
      setLoadingPhase(phaseId);
      const response = await fetch(`/api/projects/${project.id}/phases`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId, isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update phase');

      toast.success(`Fase ${!currentStatus ? 'activada' : 'detenida'} correctamente`);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar fase');
    } finally {
      setLoadingPhase(null);
    }
  };

  const handleSaveBot = async () => {
    if (!botToken.trim()) {
      toast.error('Ingresa un token de bot válido');
      return;
    }
    setIsSavingBot(true);
    try {
      // Save bot token into project configuration
      const res = await fetch(`/api/v1/projects/${project.id}/admin/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramBotToken: botToken.trim() }),
      });
      if (!res.ok) throw new Error('Error al vincular el bot de Telegram');

      toast.success('Bot de Telegram vinculado con éxito para Mini App TMA');
      setBotToken('');
    } catch (err: any) {
      toast.error(err.message || 'Error al vincular bot');
    } finally {
      setIsSavingBot(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="p-5 bg-gradient-to-r from-sky-950/40 via-zinc-900/60 to-black border border-sky-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold shadow-lg shadow-sky-500/10 shrink-0">
            <Cog6ToothIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Tokenomics & Bots de Emisión
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold">
                CAPITAL ENGINE
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Control de rondas de inversión, precios por token, límites de fase y Mini-Apps en Telegram.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── COL 1: FASES DE VENTA ── */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
                Fases de Venta & Emisión
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Activación y control de precios por fase
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
              {phases.length} Fases
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {phases.length > 0 ? (
              phases.map((phase: any) => (
                <div
                  key={phase.id}
                  className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm">{phase.name}</p>
                      {phase.isSoftCap && (
                        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-mono font-bold tracking-wider">
                          Soft Cap
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-1">
                      {phase.type === 'time' ? `${phase.limit} días` : `$${Number(phase.limit || 0).toLocaleString()} USD límite`} •{' '}
                      <span className="text-emerald-400 font-semibold">
                        {phase.tokenPrice ? `$${phase.tokenPrice} USD / token` : 'Precio Dinámico'}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleTogglePhase(phase.id, phase.isActive)}
                    disabled={loadingPhase === phase.id}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      phase.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700 hover:text-white'
                    }`}
                  >
                    {loadingPhase === phase.id ? (
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${phase.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                    )}
                    <span>{phase.isActive ? 'Fase Activa' : 'Detenida'}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono bg-black/20 rounded-2xl border border-white/5">
                No hay fases de venta configuradas para este protocolo.
              </div>
            )}
          </div>
        </div>

        {/* ── COL 2: TELEGRAM TMA BOT INTEGRATION ── */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 border-t-2 border-t-sky-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Telegram TMA & Bot de Protocolo
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Mini App para consulta de balances y comunidad
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Permite a tus inversionistas y comunidad consultar su balance de tokens, participar en votaciones DAO y recibir alertas de gobernanza directamente desde un Telegram Mini App (TMA).
          </p>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-mono text-zinc-400 font-medium">
              Bot Token de Telegram (@BotFather)
            </label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="w-full bg-black/60 border border-white/10 focus:border-sky-500 focus:outline-none rounded-xl px-4 py-2.5 text-white text-xs font-mono transition-colors"
              placeholder="Ej: 8639272150:AAEVRsfH..."
            />
            <button
              onClick={handleSaveBot}
              disabled={isSavingBot}
              className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSavingBot ? 'Vinculando Bot...' : 'Vincular Bot de Telegram'}</span>
            </button>
          </div>

          <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl space-y-2 mt-4 text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-2 text-sky-300 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Conexión Mesh Pandoras TMA</span>
            </div>
            <p>
              El bot se integra con <strong className="text-zinc-200">pandoras_tgApp</strong> y permite a los miembros firmar transacciones Web3 de la red EVM configurada ({project.chainId || '8453'}).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
