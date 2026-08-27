'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Loader2, 
  ExternalLink, 
  CheckCircle2, 
  Info,
  Radio
} from 'lucide-react';

interface Operator {
  id: string;
  externalUserId: string;
  address: string;
  status: string;
  createdAt: string;
}

interface TelegramOperatorLinkCardProps {
  organizationSlug: string;
  organizationName: string;
}

export function TelegramOperatorLinkCard({ organizationSlug, organizationName }: TelegramOperatorLinkCardProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchOperators = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hermes/tenants/${encodeURIComponent(organizationSlug)}/operators`);
      const data = await res.json();
      if (res.ok && data.operators) {
        setOperators(data.operators);
      }
    } catch (err) {
      console.error('Failed to fetch operators:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = inputVal.trim().replace(/^@/, '');
    if (!cleanInput) return;

    // Solo IDs numéricos: los @usuario no son resolubles de forma segura
    // y jamás matchearían el sender id numérico de Telegram.
    if (!/^\d{3,20}$/.test(cleanInput)) {
      setStatusMsg({
        text: 'Ingresa el ID numérico de Telegram (obténlo con @userinfobot). Los @usuario no son válidos.',
        type: 'error',
      });
      return;
    }

    try {
      setAdding(true);
      setStatusMsg(null);
      const res = await fetch(`/api/v1/hermes/tenants/${encodeURIComponent(organizationSlug)}/operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: cleanInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al vincular operador');

      setStatusMsg({ text: `Operador ${cleanInput} vinculado con éxito.`, type: 'success' });
      setInputVal('');
      await fetchOperators();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error al vincular', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveOperator = async (operatorId: string) => {
    try {
      setRemovingId(operatorId);
      setStatusMsg(null);
      const res = await fetch(
        `/api/v1/hermes/tenants/${encodeURIComponent(organizationSlug)}/operators?id=${encodeURIComponent(operatorId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al desvincular');

      setStatusMsg({ text: 'Operador desvinculado correctamente.', type: 'success' });
      await fetchOperators();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error al desvincular', type: 'error' });
    } finally {
      setRemovingId(null);
    }
  };

  const botUsername = process.env.NEXT_PUBLIC_HERMES_TELEGRAM_BOT_USERNAME || 'HermesOSBot';
  const botDeepLink = `https://t.me/${botUsername}?start=org_${organizationSlug}`;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-[#0A0D18] to-[#06080F] p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Background cybernetic glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">Operadores de Telegram (Hermes OS)</h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-300">
                <Radio className="w-2.5 h-2.5 animate-pulse text-blue-400" />
                Command Center
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              Notificaciones proactivas, escalación humana y Mini App para <strong className="text-zinc-200">{organizationName}</strong>
            </p>
          </div>
        </div>

        {/* Bot Launch Button */}
        <a
          href={botDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-200 text-xs font-mono transition-all shrink-0 hover:brightness-110 active:scale-95 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Abrir @{botUsername}</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>

      {/* Distinction banner */}
      <div className="mb-4 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Acceso de Operador:</strong> Vincula tu Telegram personal para recibir alertas de fallos K26, descubrimientos KNOW y operar la Mini App de este tenant. <span className="text-zinc-500">No interfiere con los bots comerciales de atención a clientes (Canales).</span>
        </p>
      </div>

      {/* Operator Add Form */}
      <form onSubmit={handleAddOperator} className="flex flex-col sm:flex-row items-center gap-2.5 mb-4">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Telegram ID numérico (ej: 123456789 — consíguelo con @userinfobot)"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={adding}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !inputVal.trim()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold font-mono transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 shadow-md shadow-blue-600/20"
        >
          {adding ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Vinculando...</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Vincular Operador</span>
            </>
          )}
        </button>
      </form>

      {/* Status Feedback */}
      {statusMsg && (
        <div
          className={`mb-4 p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Info className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Active Operators List */}
      <div>
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
          Operadores Activos ({operators.length})
        </h4>

        {loading ? (
          <div className="flex items-center gap-2 py-3 text-xs font-mono text-zinc-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Cargando operadores...</span>
          </div>
        ) : operators.length === 0 ? (
          <div className="py-4 text-center border border-dashed border-white/10 rounded-xl bg-black/20">
            <p className="text-xs text-zinc-500 font-mono">No hay operadores de Telegram vinculados a este tenant.</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Agrega tu ID o usuario para recibir alertas y activar la Mini App.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {operators.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-black/30 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-300 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate font-mono">{op.address}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">ID: {op.externalUserId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    ACTIVO
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOperator(op.id)}
                    disabled={removingId === op.id}
                    title="Desvincular operador"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    {removingId === op.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
