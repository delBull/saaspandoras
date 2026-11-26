'use client';

/**
 * Bandeja de solicitudes de acceso (Developer Hub, Deal Rooms, Settings…).
 *
 * Vive en `/nexus/ops?tab=approvals`, junto a las aprobaciones de Hermes.
 * Aprobar escribe el permiso del módulo en el colaborador; no cambia su rol.
 */
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, ShieldQuestion, Loader2, RefreshCw } from 'lucide-react';
import { MODULE_LABEL, type AccessModule } from '@/lib/nexus/access-modules';

interface AccessRequestRow {
  id: string;
  email: string;
  name: string;
  role: string;
  module: AccessModule;
  message: string | null;
  requestedAt: string;
}

function token() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pandoras_nexus_token') ?? localStorage.getItem('nexus_token');
}

export function AccessRequestsInbox() {
  const [rows, setRows] = useState<AccessRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const stored = token();
      const res = await fetch('/api/nexus/access-requests?status=PENDING', {
        cache: 'no-store',
        headers: stored ? { 'x-nexus-token': stored } : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; requests?: AccessRequestRow[] };
      setRows(data.ok && Array.isArray(data.requests) ? data.requests : []);
    } catch {
      setFlash({ ok: false, text: 'No se pudo cargar la bandeja.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (row: AccessRequestRow, decision: 'APPROVE' | 'REJECT') => {
    const note =
      decision === 'REJECT'
        ? window.prompt(`Motivo del rechazo para ${row.name} (opcional):`) ?? ''
        : '';
    setBusy(row.id);
    setFlash(null);
    try {
      const stored = token();
      const res = await fetch(`/api/nexus/access-requests/${row.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(stored ? { 'x-nexus-token': stored } : {}),
        },
        body: JSON.stringify({ decision, note }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        permissionGranted?: string | null;
      };

      if (!res.ok || !data.ok) {
        setFlash({ ok: false, text: data.error ?? 'No se pudo aplicar la decisión.' });
        return;
      }

      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setFlash({
        ok: true,
        text:
          decision === 'APPROVE'
            ? `Acceso concedido a ${row.name} (${MODULE_LABEL[row.module] ?? row.module}).`
            : `Solicitud de ${row.name} rechazada.`,
      });
    } catch {
      setFlash({ ok: false, text: 'Error de red al decidir.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.04] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-violet-300">
          <ShieldQuestion className="h-3.5 w-3.5" />
          Solicitudes de acceso
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-white"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          RECARGAR
        </button>
      </div>

      {flash && (
        <p className={`mt-2 text-[11px] font-mono ${flash.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
          {flash.text}
        </p>
      )}

      {loading ? (
        <p className="mt-3 text-[11px] text-zinc-500">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-[11px] text-zinc-500">Sin solicitudes pendientes.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs text-white">
                  <span className="font-semibold">{row.name}</span>
                  <span className="text-zinc-500"> · {row.email}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-violet-200">
                  Pide acceso a <strong>{MODULE_LABEL[row.module] ?? row.module}</strong>
                  <span className="text-zinc-500"> · rol {row.role}</span>
                </p>
                {row.message && <p className="mt-1 text-[11px] text-zinc-400">{row.message}</p>}
                <p className="mt-1 text-[10px] font-mono text-zinc-600">
                  {new Date(row.requestedAt).toLocaleString('es-MX')}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void decide(row, 'APPROVE')}
                  disabled={busy === row.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-40"
                >
                  {busy === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  APROBAR
                </button>
                <button
                  type="button"
                  onClick={() => void decide(row, 'REJECT')}
                  disabled={busy === row.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/20 disabled:opacity-40"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  RECHAZAR
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
