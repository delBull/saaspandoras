'use client';

import { useCallback, useEffect, useState } from 'react';

interface DemoLink {
  id: string;
  label: string;
  expires_at: string;
  revoked_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  active: boolean;
}

/**
 * Administración → Demos.
 *
 * Crea enlaces de demostración en solo lectura, muestra cuántas veces se abrieron
 * y permite revocarlos. El enlace se muestra UNA sola vez (solo se guarda su hash).
 */
export default function AdminDemosPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [label, setLabel] = useState('');
  const [ttlDays, setTtlDays] = useState('7');
  const [links, setLinks] = useState<DemoLink[]>([]);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (orgId: string) => {
    if (!orgId) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/admin/demo-links?organizationId=${encodeURIComponent(orgId)}`,
        { credentials: 'include' },
      );
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudieron cargar los enlaces.');
        setLinks([]);
        return;
      }
      setLinks(body.links ?? []);
    } catch {
      setError('No se pudieron cargar los enlaces.');
    }
  }, []);

  useEffect(() => {
    if (organizationId) void load(organizationId);
  }, [organizationId, load]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreatedUrl(null);
    try {
      const res = await fetch('/api/v1/admin/demo-links', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationId, label, ttlDays: Number(ttlDays) }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo crear el enlace.');
        return;
      }
      setCreatedUrl(body.url);
      setLabel('');
      await load(organizationId);
    } catch {
      setError('No se pudo crear el enlace.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/demo-links?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo revocar.');
        return;
      }
      await load(organizationId);
    } catch {
      setError('No se pudo revocar.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Compartir demo</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Enlaces de solo lectura para mostrar el producto sin crear identidades ni tocar permisos.
          El enlace se muestra una sola vez y caduca solo.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={create} className="mb-8 grid gap-3 rounded-xl border border-white/10 p-5 md:grid-cols-4">
        <input
          required
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
          placeholder="organizationId (UUID)"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder:text-zinc-600 md:col-span-2"
        />
        <input
          required
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Etiqueta (ej. Demo Celeste)"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
        <div className="flex gap-2">
          <input
            value={ttlDays}
            onChange={(event) => setTtlDays(event.target.value)}
            inputMode="numeric"
            className="w-16 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={busy || !organizationId || !label}
            className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {busy ? 'Creando…' : 'Crear enlace'}
          </button>
        </div>
      </form>

      {createdUrl && (
        <div className="mb-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Enlace creado — cópialo ahora, no se puede recuperar
          </p>
          <code className="mt-2 block break-all rounded bg-black/40 p-2 text-xs text-emerald-100">
            {createdUrl}
          </code>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(createdUrl)}
            className="mt-2 rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs text-emerald-200"
          >
            Copiar
          </button>
        </div>
      )}

      <section className="rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Etiqueta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Caduca</th>
              <th className="px-4 py-3">Aperturas</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {links.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-zinc-600">
                  Sin enlaces para esta organización.
                </td>
              </tr>
            )}
            {links.map((link) => (
              <tr key={link.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white">{link.label}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      link.active
                        ? 'rounded bg-emerald-500/15 px-2 py-1 text-[10px] uppercase text-emerald-300'
                        : 'rounded bg-zinc-500/15 px-2 py-1 text-[10px] uppercase text-zinc-400'
                    }
                  >
                    {link.revoked_at ? 'revocado' : link.active ? 'vigente' : 'expirado'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{String(link.expires_at).slice(0, 10)}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {link.view_count}
                  {link.last_viewed_at ? (
                    <span className="ml-1 text-[10px] text-zinc-600">
                      ({String(link.last_viewed_at).slice(0, 10)})
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  {link.active && (
                    <button
                      type="button"
                      onClick={() => void revoke(link.id)}
                      className="rounded border border-red-500/40 px-2 py-1 text-[11px] text-red-300"
                    >
                      Revocar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
