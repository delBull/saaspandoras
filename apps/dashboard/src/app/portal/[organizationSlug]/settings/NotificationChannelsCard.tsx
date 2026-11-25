'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Canales de aviso del tenant (ADR-020 §2.5).
 *
 * Aquí el tenant conecta su webhook de Discord. La organización la resuelve el
 * servidor desde la sesión; esta tarjeta sólo manda `kind` y `url`.
 *
 * Sin canal configurado los avisos quedan sólo in-app: nunca se cae a un canal
 * de la plataforma.
 */

interface ChannelRow {
  kind: string;
  target: string | null;
  enabled: boolean;
}

const KINDS = [
  { value: 'leads', label: 'Leads' },
  { value: 'approvals', label: 'Aprobaciones' },
  { value: 'alerts', label: 'Alertas' },
];

export function NotificationChannelsCard({ organizationSlug }: { organizationSlug: string }) {
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [kind, setKind] = useState('leads');
  const [url, setUrl] = useState('');

  const endpoint = `/api/v1/tenant/${encodeURIComponent(organizationSlug)}/notification-channels`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.channels)) setRows(data.channels);
    } catch {
      // silencio: se muestra el estado vacío
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, url: url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `No se pudo guardar (${res.status}).`);
        return;
      }
      setNotice(`Canal de ${kind} conectado.`);
      setUrl('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Error de red.');
    } finally {
      setSaving(false);
    }
  };

  const disable = async (rowKind: string) => {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${endpoint}?kind=${encodeURIComponent(rowKind)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'No se pudo desactivar.');
        return;
      }
      setNotice(`Canal de ${rowKind} desactivado.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Error de red.');
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">Notificaciones</p>
      <h2 className="mt-2 text-lg font-semibold text-white">Canales de aviso</h2>
      <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-zinc-400">
        A dónde se avisa de un lead nuevo, de una aprobación pendiente o de una alerta del tenant.
        Sin canal, el aviso queda sólo en el portal. Nunca se envía a canales de otra organización.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[12px] text-emerald-200">
          {notice}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-[12px] text-zinc-500">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="text-[12px] text-zinc-500">Todavía no hay canales conectados.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.kind}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white">{row.kind}</p>
                <p className="truncate font-mono text-[10px] text-zinc-500">{row.target ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                    row.enabled
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400'
                  }`}
                >
                  {row.enabled ? 'activo' : 'inactivo'}
                </span>
                {row.enabled && (
                  <button
                    type="button"
                    onClick={() => void disable(row.kind)}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-200 hover:bg-red-500/20"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={save} className="mt-5 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-white/25"
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[11px] text-white placeholder-zinc-600 outline-none focus:border-white/25"
        />
        <button
          type="submit"
          disabled={saving || !url.trim()}
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-[12px] font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-40"
        >
          {saving ? 'Guardando…' : 'Conectar'}
        </button>
      </form>

      <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">
        El webhook se guarda en el servidor y se muestra enmascarado. Si lo regeneras en Discord,
        vuelve a pegarlo aquí.
      </p>
    </section>
  );
}
