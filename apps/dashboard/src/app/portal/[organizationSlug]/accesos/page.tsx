'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

/**
 * Portal → Accesos (grants).
 *
 * Emite y revoca capabilities de una identidad humana. La autoridad real está en
 * el servidor (bootstrap: identity.write; estricto: governance.grant.manage).
 */
export default function GrantsPage() {
  const params = useParams<{ organizationSlug: string }>();
  const organizationSlug = params?.organizationSlug ?? '';

  const [subjectId, setSubjectId] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [ttlDays, setTtlDays] = useState('30');
  const [grantId, setGrantId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function issue(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/authorization/grants', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          organizationSlug,
          subjectId,
          capabilities: capabilities
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          ttlSeconds: Number(ttlDays) * 24 * 60 * 60,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo emitir el grant.');
        return;
      }
      setMessage(
        `Grant ${body.grant.id} emitido${body.bootstrap ? ' (bootstrap)' : ''} · caduca ${new Date(
          body.grant.expiresAt * 1000,
        )
          .toISOString()
          .slice(0, 10)}`,
      );
      setSubjectId('');
      setCapabilities('');
    } catch {
      setError('No se pudo emitir el grant.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/v1/authorization/grants?organizationSlug=${encodeURIComponent(
          organizationSlug,
        )}&grantId=${encodeURIComponent(grantId)}`,
        { method: 'DELETE', credentials: 'include' },
      );
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo revocar.');
        return;
      }
      setMessage('Grant revocado. Efectivo en la siguiente petición.');
      setGrantId('');
    } catch {
      setError('No se pudo revocar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Accesos</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Capabilities canónicas por identidad. Sin grant no hay acceso.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <form onSubmit={issue} className="mb-8 space-y-3 rounded-xl border border-white/10 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Emitir grant</h2>
        <input
          required
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          placeholder="Identidad (p. ej. collaborator:7)"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
        <input
          required
          value={capabilities}
          onChange={(event) => setCapabilities(event.target.value)}
          placeholder="crm.opportunity.read, crm.opportunity.write"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
        <div className="flex items-center gap-3">
          <input
            value={ttlDays}
            onChange={(event) => setTtlDays(event.target.value)}
            inputMode="numeric"
            className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <span className="text-xs text-zinc-500">días (máx. 90)</span>
          <button
            type="submit"
            disabled={busy || !subjectId || !capabilities}
            className="ml-auto rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            Emitir
          </button>
        </div>
      </form>

      <form onSubmit={revoke} className="space-y-3 rounded-xl border border-white/10 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Revocar grant</h2>
        <div className="flex items-center gap-3">
          <input
            required
            value={grantId}
            onChange={(event) => setGrantId(event.target.value)}
            placeholder="grantId"
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={busy || !grantId}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-40"
          >
            Revocar
          </button>
        </div>
      </form>
    </div>
  );
}
