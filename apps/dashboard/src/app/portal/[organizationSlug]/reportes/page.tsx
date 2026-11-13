'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Metric {
  key: string;
  value: number | null;
  unit: 'count' | 'usd' | 'ratio';
  status: 'ok' | 'partial' | 'unavailable' | 'inconsistent';
  reason?: string;
  source: { table: string; field?: string; ruleVersion: string };
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  timezone: string;
  attributionWindowDays: number;
  metrics: Record<string, Metric>;
  reconciliation: Array<{ rule: string; status: string; detail?: string }>;
  inputsHash: string;
}

const LABELS: Record<string, string> = {
  leads_captured: 'Leads captados',
  leads_valid: 'Leads válidos',
  opportunities_created: 'Oportunidades creadas',
  opportunities_qualified: 'Calificadas',
  discovery_requests: 'Discovery solicitados',
  visits_completed: 'Visitas realizadas',
  ad_spend_actual: 'Gasto publicitario (comprobado)',
  ad_budget_assigned: 'Presupuesto comprometido',
  cpl: 'CPL',
  revenue_estimated: 'Pipeline estimado',
  closed_revenue: 'Ingreso cerrado',
};

const BADGE: Record<Metric['status'], string> = {
  ok: 'bg-emerald-500/15 text-emerald-300',
  partial: 'bg-amber-500/15 text-amber-300',
  unavailable: 'bg-zinc-500/15 text-zinc-400',
  inconsistent: 'bg-red-500/15 text-red-300',
};

function format(metric: Metric): string {
  if (metric.value === null) return '—';
  if (metric.unit === 'usd') return `$${metric.value.toLocaleString('en-US')}`;
  return metric.value.toLocaleString('en-US');
}

/** Reporte semanal: lo que falta se muestra como `unavailable`, nunca como 0. */
export default function WeeklyReportPage() {
  const params = useParams<{ organizationSlug: string }>();
  const organizationSlug = params?.organizationSlug ?? '';

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [valid, setValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [window, setWindow] = useState('90');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/reporting/weekly?organizationSlug=${encodeURIComponent(
          organizationSlug,
        )}&attributionWindowDays=${encodeURIComponent(window)}`,
        { credentials: 'include' },
      );
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'No se pudo cargar el reporte.');
        return;
      }
      setReport(body.report);
      setValid(Boolean(body.valid));
    } catch {
      setError('No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [organizationSlug, window]);

  useEffect(() => {
    if (organizationSlug) void load();
  }, [organizationSlug, load]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reporte semanal</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Zona horaria de negocio y ventana de atribución declaradas por métrica.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          Ventana
          <input
            value={window}
            onChange={(event) => setWindow(event.target.value)}
            inputMode="numeric"
            className="w-16 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
          />
          días
        </label>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-zinc-500">Cargando…</p>}

      {report && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>
              {report.weekStart.slice(0, 10)} → {report.weekEnd.slice(0, 10)}
            </span>
            <span>· {report.timezone}</span>
            <span>· atribución {report.attributionWindowDays} d</span>
            <span className="font-mono">· {report.inputsHash}</span>
            {!valid && (
              <span className="rounded bg-red-500/15 px-2 py-1 text-red-300">
                Reporte inválido: reconciliación inconsistente
              </span>
            )}
          </div>

          <section className="mb-8 grid gap-3 md:grid-cols-2">
            {Object.values(report.metrics).map((metric) => (
              <article
                key={metric.key}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <header className="flex items-start justify-between gap-3">
                  <h2 className="text-sm text-zinc-300">{LABELS[metric.key] ?? metric.key}</h2>
                  <span className={`rounded px-2 py-1 text-[10px] uppercase ${BADGE[metric.status]}`}>
                    {metric.status}
                  </span>
                </header>
                <p className="mt-2 text-2xl font-bold text-white">{format(metric)}</p>
                {metric.reason && <p className="mt-1 text-xs text-zinc-500">{metric.reason}</p>}
                <p className="mt-2 font-mono text-[10px] text-zinc-600">
                  {metric.source.table}
                  {metric.source.field ? `.${metric.source.field}` : ''} · {metric.source.ruleVersion}
                </p>
              </article>
            ))}
          </section>

          <section className="rounded-xl border border-white/10 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Reconciliación
            </h2>
            <ul className="space-y-2 text-sm">
              {report.reconciliation.map((rule) => (
                <li key={rule.rule} className="flex items-start justify-between gap-3">
                  <span className="text-zinc-300">{rule.rule}</span>
                  <span className="text-right text-xs text-zinc-500">
                    {rule.status}
                    {rule.detail ? ` · ${rule.detail}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
