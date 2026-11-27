'use client';

/**
 * 🔑 Mi agente (ADR-021) — Developer Hub
 *
 * Permite a un colaborador con `developer`:
 *   - emitir su clave de agente (se muestra una sola vez),
 *   - ver estado y caducidad,
 *   - pedir una delegación acotada (queda pendiente del owner),
 *   - revocar su clave.
 *
 * Un admin ve además las delegaciones pendientes para aprobarlas o revocarlas.
 * El contenido sensible se filtra en servidor: este componente sólo se monta
 * cuando `canDevelop` es true.
 */
import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Plus, ShieldCheck, Trash2, Clock, Copy, Check, AlertTriangle } from 'lucide-react';

interface AgentKeyRow {
  id: string;
  label: string;
  keyPrefix: string;
  status: string;
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface DelegationRow {
  id: string;
  agentKeyId: string;
  capabilities: string[];
  scope: Record<string, string[]>;
  status: string;
  expiresAt: string;
  createdAt: string;
  approvedBy: string | null;
}

const CAPABILITY_LABEL: Record<string, string> = {
  developer: 'Developer Hub',
  dealroom: 'Deal Rooms',
  settings: 'Settings',
  hermesqa: 'Hermes QA',
  academy: 'Academy',
};

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pandoras_nexus_token') ?? localStorage.getItem('nexus_token');
  return token ? { 'x-nexus-token': token } : {};
}

export function AgentAccessPanel({ isAdmin }: { isAdmin: boolean }) {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<AgentKeyRow[]>([]);
  const [delegations, setDelegations] = useState<DelegationRow[]>([]);
  const [delegable, setDelegable] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState('Mi agente');
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [requestFor, setRequestFor] = useState<AgentKeyRow | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nexus/agent/keys', { cache: 'no-store', headers: authHeaders() });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        keys?: AgentKeyRow[];
        delegations?: DelegationRow[];
        delegable?: string[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'No se pudo cargar tu acceso de agente.');
        return;
      }
      setKeys(data.keys ?? []);
      setDelegations(data.delegations ?? []);
      setDelegable(data.delegable ?? []);
    } catch {
      setError('Error de red al cargar tu acceso de agente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createKey = async () => {
    setCreating(true);
    setError(null);
    setSecret(null);
    try {
      const res = await fetch('/api/nexus/agent/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ label, days: 90 }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; secret?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'No se pudo emitir la clave.');
        return;
      }
      setSecret(data.secret ?? null);
      await load();
    } catch {
      setError('Error de red al emitir la clave.');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!window.confirm('¿Revocar esta clave? Tu agente dejará de funcionar en la siguiente petición.')) return;
    try {
      const res = await fetch(`/api/nexus/agent/keys/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ reason: 'revocada desde el Developer Hub' }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'No se pudo revocar.');
        return;
      }
      await load();
    } catch {
      setError('Error de red al revocar.');
    }
  };

  const submitDelegation = async () => {
    if (!requestFor || picked.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/nexus/agent/delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ agentKeyId: requestFor.id, capabilities: picked, days }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'No se pudo pedir la delegación.');
        return;
      }
      setRequestFor(null);
      setPicked([]);
      await load();
    } catch {
      setError('Error de red al pedir la delegación.');
    } finally {
      setSaving(false);
    }
  };

  const decide = async (id: string, decision: 'APPROVE' | 'REJECT' | 'REVOKE') => {
    try {
      const res = await fetch(`/api/nexus/agent/delegations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'No se pudo aplicar la decisión.');
        return;
      }
      await load();
    } catch {
      setError('Error de red al decidir.');
    }
  };

  // ── Recursos compartidos (admin) ────────────────────────────────────────────
  const [collabOptions, setCollabOptions] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [shares, setShares] = useState<Array<{
    id: string;
    resourceType: string;
    resourceId: string;
    capabilities: string[];
    collaboratorName: string | null;
    collaboratorEmail: string | null;
    expiresAt: string | null;
  }>>([]);
  const [shareForm, setShareForm] = useState({
    collaboratorId: '',
    resourceType: 'pod',
    resourceId: '',
    capabilities: ['dealRoom'] as string[],
    days: 30,
  });
  const [shareBusy, setShareBusy] = useState(false);

  const loadShares = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [sharesRes, collabRes] = await Promise.all([
        fetch('/api/nexus/agent/shares', { cache: 'no-store', headers: authHeaders() }),
        fetch('/api/nexus/collaborators/list', { cache: 'no-store', headers: authHeaders() }),
      ]);
      const sharesData = (await sharesRes.json().catch(() => ({}))) as { ok?: boolean; shares?: any[] };
      if (sharesData.ok && Array.isArray(sharesData.shares)) setShares(sharesData.shares);

      const collabData = (await collabRes.json().catch(() => ({}))) as { collaborators?: any[] };
      const list = Array.isArray(collabData.collaborators) ? collabData.collaborators : [];
      setCollabOptions(
        list.map((c: any) => ({ id: Number(c.id ?? c.collaboratorId), name: c.name ?? c.email, email: c.email }))
          .filter((c: any) => Number.isFinite(c.id)),
      );
    } catch {
      /* se reintenta con RECARGAR */
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadShares();
  }, [loadShares]);

  const createShare = async () => {
    setShareBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/nexus/agent/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          collaboratorId: Number(shareForm.collaboratorId),
          resourceType: shareForm.resourceType,
          resourceId: shareForm.resourceId.trim(),
          capabilities: shareForm.capabilities,
          days: shareForm.days,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'No se pudo compartir el recurso.');
        return;
      }
      setShareForm((prev) => ({ ...prev, resourceId: '' }));
      await loadShares();
    } catch {
      setError('Error de red al compartir el recurso.');
    } finally {
      setShareBusy(false);
    }
  };

  const revokeShare = async (id: string) => {
    if (!window.confirm('¿Revocar el acceso a este recurso?')) return;
    try {
      const res = await fetch(`/api/nexus/agent/shares/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'No se pudo revocar.');
        return;
      }
      await loadShares();
    } catch {
      setError('Error de red al revocar.');
    }
  };

  const pending = delegations.filter((d) => d.status === 'PENDING');

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-emerald-300">
            <KeyRound className="h-3.5 w-3.5" /> Mi agente
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">Conecta tu propia IA a Nexus</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Tu agente actúa <strong className="text-zinc-200">como tú</strong>, con tus permisos y sólo sobre los
            recursos que te deleguen. La clave se muestra una vez; la delegación caduca y se renueva con una
            aprobación.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-mono text-zinc-400 hover:text-white"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'RECARGAR'}
        </button>
      </div>

      {error && <p className="mt-3 text-[11px] font-mono text-rose-300">{error}</p>}

      {/* Emisión */}
      <div className="mt-5 flex flex-wrap items-end gap-2">
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
          Nombre de la clave
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value.slice(0, 120))}
            className="mt-1 block w-56 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
          />
        </label>
        <button
          type="button"
          onClick={() => void createKey()}
          disabled={creating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-[11px] font-bold text-black hover:bg-emerald-400 disabled:opacity-40"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          EMITIR CLAVE
        </button>
      </div>

      {secret && (
        <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> Cópiala ahora: no se vuelve a mostrar
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-black/60 px-2 py-1.5 text-[11px] text-emerald-200">
              {secret}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(secret).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-mono text-zinc-300 hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Claves */}
      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="text-[11px] text-zinc-500">Cargando…</p>
        ) : keys.length === 0 ? (
          <p className="text-[11px] text-zinc-500">Aún no tienes claves de agente.</p>
        ) : (
          keys.map((key) => {
            const active = key.status === 'ACTIVE' && new Date(key.expiresAt) > new Date();
            return (
              <div
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-white">
                    {key.label} <span className="font-mono text-[10px] text-zinc-500">{key.keyPrefix}…</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                    <Clock className="h-3 w-3" /> vence {new Date(key.expiresAt).toLocaleDateString('es-MX')}
                    <span className={active ? 'text-emerald-300' : 'text-rose-300'}>· {active ? key.status : 'INACTIVA'}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRequestFor(key);
                      setPicked([]);
                    }}
                    className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-200 hover:bg-sky-500/20"
                  >
                    PEDIR DELEGACIÓN
                  </button>
                  <button
                    type="button"
                    onClick={() => void revoke(key.id)}
                    className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-200 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pedir delegación */}
      {requestFor && (
        <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/[0.05] p-3">
          <p className="text-[11px] font-mono uppercase text-sky-300">
            Delegación para “{requestFor.label}”
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {delegable.length === 0 && (
              <p className="text-[11px] text-zinc-400">No tienes módulos delegables todavía.</p>
            )}
            {delegable.map((cap) => {
              const on = picked.includes(cap);
              return (
                <button
                  key={cap}
                  type="button"
                  onClick={() =>
                    setPicked((prev) => (on ? prev.filter((c) => c !== cap) : [...prev, cap]))
                  }
                  className={`rounded-md border px-2 py-1 text-[10px] ${
                    on ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 text-zinc-400'
                  }`}
                >
                  {CAPABILITY_LABEL[cap.toLowerCase()] ?? cap}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <label className="text-[10px] font-mono uppercase text-zinc-400">
              Días
              <input
                type="number"
                min={1}
                max={90}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="ml-2 w-16 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
              />
            </label>
            <button
              type="button"
              onClick={() => void submitDelegation()}
              disabled={saving || picked.length === 0}
              className="rounded-lg bg-sky-500 px-3 py-1.5 text-[11px] font-bold text-black hover:bg-sky-400 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'ENVIAR A APROBACIÓN'}
            </button>
            <button
              type="button"
              onClick={() => setRequestFor(null)}
              className="text-[11px] text-zinc-400 hover:text-white"
            >
              cancelar
            </button>
          </div>
        </div>
      )}

      {/* Estado de delegaciones */}
      {delegations.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Mis delegaciones</p>
          <ul className="mt-2 space-y-1.5">
            {delegations.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5">
                <span className="text-[11px] text-zinc-300">
                  {d.capabilities.map((c) => CAPABILITY_LABEL[c.toLowerCase()] ?? c).join(' · ') || '—'}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                    d.status === 'ACTIVE'
                      ? 'border-emerald-500/40 text-emerald-300'
                      : d.status === 'PENDING'
                        ? 'border-amber-500/40 text-amber-300'
                        : 'border-white/10 text-zinc-500'
                  }`}
                >
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Admin: aprobar delegaciones */}
      {isAdmin && pending.length > 0 && (
        <div className="mt-6 rounded-xl border border-violet-500/30 bg-violet-500/[0.05] p-3">
          <p className="text-[11px] font-mono uppercase text-violet-300">
            Delegaciones pendientes de tu aprobación
          </p>
          <ul className="mt-2 space-y-2">
            {pending.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <span className="text-[11px] text-zinc-300">
                  {d.capabilities.map((c) => CAPABILITY_LABEL[c.toLowerCase()] ?? c).join(' · ') || '—'}
                  <span className="ml-2 text-[10px] font-mono text-zinc-500">
                    hasta {new Date(d.expiresAt).toLocaleDateString('es-MX')}
                  </span>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void decide(d.id, 'APPROVE')}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-200"
                  >
                    <ShieldCheck className="h-3 w-3" /> APROBAR
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(d.id, 'REJECT')}
                    className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-200"
                  >
                    RECHAZAR
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Admin: recursos compartidos con aprobación del dueño */}
      {isAdmin && (
        <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-3">
          <p className="text-[11px] font-mono uppercase text-amber-300">
            Recursos compartidos · aprobados por el dueño
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Concede a un colaborador un pod, sala o proyecto concreto. Sin esto, el
            scope de su delegación no le abre recursos ajenos.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <select
              value={shareForm.collaboratorId}
              onChange={(e) => setShareForm((p) => ({ ...p, collaboratorId: e.target.value }))}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-white"
            >
              <option value="">Colaborador…</option>
              {collabOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name} · {c.email}</option>
              ))}
            </select>
            <select
              value={shareForm.resourceType}
              onChange={(e) => setShareForm((p) => ({ ...p, resourceType: e.target.value }))}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-white"
            >
              <option value="pod">Deal Pod</option>
              <option value="room">Deal Room</option>
              <option value="project">Proyecto</option>
            </select>
            <input
              value={shareForm.resourceId}
              onChange={(e) => setShareForm((p) => ({ ...p, resourceId: e.target.value }))}
              placeholder={shareForm.resourceType === 'room' ? 'PDR-XXXX' : 'slug o código'}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-white"
            />
            <select
              value={shareForm.capabilities[0]}
              onChange={(e) => setShareForm((p) => ({ ...p, capabilities: [e.target.value] }))}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-white"
            >
              <option value="dealRoom">Deal Rooms</option>
              <option value="developer">Developer Hub</option>
            </select>
            <button
              type="button"
              onClick={() => void createShare()}
              disabled={shareBusy || !shareForm.collaboratorId || !shareForm.resourceId.trim()}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-black hover:bg-amber-400 disabled:opacity-40"
            >
              {shareBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'COMPARTIR'}
            </button>
          </div>

          {shares.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {shares.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5">
                  <span className="text-[11px] text-zinc-300">
                    <strong className="text-white">{s.collaboratorName ?? s.collaboratorEmail}</strong>
                    <span className="text-zinc-500"> · {s.resourceType} </span>
                    <span className="font-mono text-amber-200">{s.resourceId}</span>
                    <span className="text-zinc-500"> · {s.capabilities.join(', ')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void revokeShare(s.id)}
                    className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-200"
                  >
                    REVOCAR
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
