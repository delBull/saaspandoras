'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

const STAGES = [
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'contactado', label: 'Contactado' },
  { key: 'calificado', label: 'Calificado' },
  { key: 'discovery_solicitado', label: 'Discovery' },
  { key: 'visita_realizada', label: 'Visita' },
  { key: 'propuesta', label: 'Propuesta' },
  { key: 'ganada', label: 'Ganada' },
  { key: 'perdida', label: 'Perdida' },
] as const;

interface Opportunity {
  id: string;
  title: string;
  stageKey: string;
  ownerCollaboratorId: string;
  estimatedValueUsd: number;
  closedRevenueUsd: number | null;
  nextAction: string | null;
  nextActionAt: string | null;
  source: string;
  currency: string;
}

interface Activity {
  id: string;
  type: string;
  content: string;
  occurredAt: string;
  authorCollaboratorId: string;
}

/** Tablero por etapa. La autoridad y las reglas viven en el servidor. */
export default function CrmBoardPage() {
  const params = useParams<{ organizationSlug: string }>();
  const organizationSlug = params?.organizationSlug ?? '';

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ opportunity: Opportunity; activities: Activity[] } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ organizationSlug, limit: '100' });
      if (ownerFilter) query.set('owner', ownerFilter);
      const res = await fetch(`/api/v1/crm/opportunities?${query}`, { credentials: 'include' });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo cargar el CRM.');
        return;
      }
      setOpportunities(body.opportunities ?? []);
    } catch {
      setError('No se pudo cargar el CRM.');
    } finally {
      setLoading(false);
    }
  }, [organizationSlug, ownerFilter]);

  useEffect(() => {
    if (organizationSlug) void load();
  }, [organizationSlug, load]);

  const byStage = useMemo(() => {
    const map = new Map<string, Opportunity[]>();
    for (const stage of STAGES) map.set(stage.key, []);
    for (const opportunity of opportunities) {
      map.get(opportunity.stageKey)?.push(opportunity);
    }
    return map;
  }, [opportunities]);

  async function openDetail(opportunity: Opportunity) {
    try {
      const res = await fetch(
        `/api/v1/crm/opportunities/${opportunity.id}?organizationSlug=${encodeURIComponent(organizationSlug)}`,
        { credentials: 'include' },
      );
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo abrir el detalle.');
        return;
      }
      setSelected({ opportunity: body.opportunity, activities: body.activities ?? [] });
    } catch {
      setError('No se pudo abrir el detalle.');
    }
  }

  async function moveStage(opportunity: Opportunity, stageKey: string) {
    const stage = STAGES.find((entry) => entry.key === stageKey);
    const requiresNextAction = stage && !['nuevo', 'ganada', 'perdida'].includes(stage.key);
    const closing = stageKey === 'ganada' || stageKey === 'perdida';

    const nextAction = requiresNextAction
      ? window.prompt('Próxima acción (obligatoria en esta etapa):') ?? ''
      : undefined;
    const nextActionAt =
      requiresNextAction && nextAction ? new Date(Date.now() + 3 * 86400000).toISOString() : undefined;
    const closeReason = closing ? window.prompt('Motivo de cierre:') ?? '' : undefined;

    try {
      const res = await fetch(`/api/v1/crm/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          organizationSlug,
          stageKey,
          ...(nextAction ? { nextAction, nextActionAt } : {}),
          ...(closeReason ? { closeReason } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo mover la etapa.');
        return;
      }
      setSelected(null);
      await load();
    } catch {
      setError('No se pudo mover la etapa.');
    }
  }

  return (
    <div className="px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Valor = estimación. Los ingresos cerrados se cuentan aparte.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            placeholder="Filtrar por responsable"
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <a
            href={`/api/v1/crm/export.csv?organizationSlug=${encodeURIComponent(organizationSlug)}`}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300"
          >
            Exportar CSV
          </a>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-zinc-500">Cargando…</p>}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = byStage.get(stage.key) ?? [];
          const estimated = items.reduce((total, item) => total + item.estimatedValueUsd, 0);
          return (
            <section
              key={stage.key}
              className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-3"
            >
              <header className="mb-3 flex items-baseline justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {stage.label}
                </h2>
                <span className="text-xs text-zinc-500">{items.length}</span>
              </header>
              <p className="mb-3 text-xs text-zinc-500">
                Est. ${estimated.toLocaleString('en-US')}
              </p>

              <div className="space-y-2">
                {items.map((opportunity) => (
                  <article
                    key={opportunity.id}
                    className="rounded-lg border border-white/10 bg-black/40 p-3"
                  >
                    <button
                      type="button"
                      onClick={() => void openDetail(opportunity)}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-medium text-white">{opportunity.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {opportunity.ownerCollaboratorId} · {opportunity.source}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        ${opportunity.estimatedValueUsd.toLocaleString('en-US')}
                        {opportunity.closedRevenueUsd !== null
                          ? ` · cerrado $${opportunity.closedRevenueUsd.toLocaleString('en-US')}`
                          : ''}
                      </p>
                    </button>
                    <select
                      value=""
                      onChange={(event) => {
                        if (event.target.value) void moveStage(opportunity, event.target.value);
                      }}
                      className="mt-2 w-full rounded border border-white/10 bg-black px-2 py-1 text-xs text-zinc-300"
                    >
                      <option value="">Mover a…</option>
                      {STAGES.filter((entry) => entry.key !== opportunity.stageKey).map((entry) => (
                        <option key={entry.key} value={entry.key}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
                {items.length === 0 && (
                  <p className="py-4 text-center text-xs text-zinc-600">Sin oportunidades</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 p-6">
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.opportunity.title}</h2>
                <p className="text-xs text-zinc-500">
                  {selected.opportunity.stageKey} · {selected.opportunity.ownerCollaboratorId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm text-zinc-400"
              >
                Cerrar
              </button>
            </header>

            <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Estimado</dt>
                <dd className="text-white">
                  ${selected.opportunity.estimatedValueUsd.toLocaleString('en-US')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Ingreso cerrado</dt>
                <dd className="text-white">
                  {selected.opportunity.closedRevenueUsd === null
                    ? '—'
                    : `$${selected.opportunity.closedRevenueUsd.toLocaleString('en-US')}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Próxima acción</dt>
                <dd className="text-zinc-300">{selected.opportunity.nextAction ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Fecha</dt>
                <dd className="text-zinc-300">
                  {selected.opportunity.nextActionAt
                    ? selected.opportunity.nextActionAt.slice(0, 10)
                    : '—'}
                </dd>
              </div>
            </dl>

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Historial
            </h3>
            <ul className="space-y-2 text-sm">
              {selected.activities.length === 0 && (
                <li className="text-xs text-zinc-600">Sin actividad registrada.</li>
              )}
              {selected.activities.map((activity) => (
                <li key={activity.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                  <p className="text-xs text-zinc-500">
                    {activity.type} · {activity.occurredAt.slice(0, 16).replace('T', ' ')} ·{' '}
                    {activity.authorCollaboratorId}
                  </p>
                  <p className="text-zinc-300">{activity.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
