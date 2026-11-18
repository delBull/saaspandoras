'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Collaborator {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string | null;
  projects: string[];
}

const ROLES = ['OPERATOR', 'ADMIN', 'VIEWER'] as const;

/**
 * Portal → Colaboradores.
 *
 * Invita personas a la organización y muestra quién tiene acceso.
 * Toda la autoridad se valida en el servidor: esta pantalla solo presenta y
 * solicita. Ocultar un botón no es un control.
 */
export default function CollaboratorsPage() {
  const params = useParams<{ organizationSlug: string }>();
  const organizationSlug = params?.organizationSlug ?? '';

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('OPERATOR');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/portal/collaborators?organizationSlug=${encodeURIComponent(organizationSlug)}`,
        { credentials: 'include' },
      );
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo cargar el equipo.');
        return;
      }
      setCollaborators(body.collaborators ?? []);
    } catch {
      setError('No se pudo cargar el equipo.');
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    if (organizationSlug) void load();
  }, [organizationSlug, load]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch('/api/v1/portal/collaborators', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationSlug, email, name, role }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo invitar.');
        return;
      }

      setNotice(
        body.emailSent
          ? `Invitación enviada a ${body.collaborator.email}.`
          : `Credencial creada para ${body.collaborator.email}, pero el correo no se pudo enviar.`,
      );
      setEmail('');
      setName('');
      setRole('OPERATOR');
      await load();
    } catch {
      setError('No se pudo invitar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Equipo</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Personas con acceso a esta organización. Cada una tiene su propia credencial.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      <form
        onSubmit={invite}
        className="mb-10 rounded-xl border border-white/10 bg-white/[0.02] p-5"
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Invitar a una persona
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre"
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@empresa.com"
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as (typeof ROLES)[number])}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="OPERATOR">Operador</option>
            <option value="ADMIN">Administrador</option>
            <option value="VIEWER">Solo lectura</option>
          </select>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            El enlace se envía por correo, es personal y de un solo uso. Caduca en 30 días.
          </p>
          <button
            type="submit"
            disabled={submitting || !email || !name}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {submitting ? 'Invitando…' : 'Invitar'}
          </button>
        </div>
      </form>

      <section className="rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Persona</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Caduca</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && collaborators.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Aún no hay colaboradores en esta organización.
                </td>
              </tr>
            )}
            {collaborators.map((collaborator) => (
              <tr key={collaborator.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="text-white">{collaborator.name}</div>
                  <div className="text-xs text-zinc-500">{collaborator.email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{collaborator.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      collaborator.status === 'ACTIVE'
                        ? 'rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300'
                        : 'rounded bg-zinc-500/15 px-2 py-1 text-xs text-zinc-400'
                    }
                  >
                    {collaborator.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {collaborator.expiresAt
                    ? new Date(collaborator.expiresAt).toISOString().slice(0, 10)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
