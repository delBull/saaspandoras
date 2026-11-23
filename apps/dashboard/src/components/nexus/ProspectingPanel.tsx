"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Radar,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { getNexusClientHeaders } from "@/lib/nexus/client-auth-headers";
import type { JobSpec, Schedule } from "@/lib/prospecting/types";
import { DOORS, SOURCE_TYPES } from "@/lib/prospecting/types";

interface JobRow {
  id: string;
  podId: string | null;
  label: string;
  mode: string;
  query: string;
  status: string;
  schedule: Schedule;
  maxAgeDays: number;
  minConfidence: number;
  runs: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  spec: JobSpec;
  stats?: {
    lastRun?: {
      at: string;
      candidates: number;
      extracted: number;
      inserted: number;
      skipped: number;
      llm: boolean;
      perSource: Array<{ source: string; found: number; warning?: string; ms: number }>;
    };
  };
}

interface ProspectRow {
  id: string;
  podId: string | null;
  jobId: string | null;
  company: string | null;
  personName: string | null;
  role: string | null;
  email: string | null;
  emailStatus: string;
  door: string | null;
  sourceType: string;
  sourceUrl: string;
  sourceTitle: string | null;
  publisher: string | null;
  publishedAt: string | null;
  confidence: number;
  extraction: string;
  status: string;
  createdAt: string;
}

interface PodOption {
  id: string;
  code: string;
  displayName: string;
}

const SOURCE_LABEL: Record<string, string> = {
  press: "Prensa",
  corporate: "Webs objetivo",
  sec: "EDGAR (SEC)",
  search: "Búsqueda web",
};

const STATUS_STYLE: Record<string, string> = {
  QUEUED: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  RUNNING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  DONE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  FAILED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  PAUSED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  NEW: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  CONTACTED: "border-purple-500/30 bg-purple-500/10 text-purple-300",
};

function dateLabel(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Prospección — interfaz del módulo.
 *
 * Reglas visibles, no escondidas: el operador puede ver qué fuentes se usan, la
 * edad máxima, la confianza mínima y el motivo de cada descarte. Nada se envía
 * automáticamente: aprobar sólo genera el link `/l/<code>` del radar.
 */
export function ProspectingPanel() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pods, setPods] = useState<PodOption[]>([]);
  const [llmAvailable, setLlmAvailable] = useState(false);
  const [filter, setFilter] = useState("NEW");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [mode, setMode] = useState<"TEXT" | "RULES">("TEXT");
  const [podId, setPodId] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [targetUrls, setTargetUrls] = useState("");
  const [selectedDoors, setSelectedDoors] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["press", "corporate"]);
  const [maxAgeDays, setMaxAgeDays] = useState("30");
  const [minConfidence, setMinConfidence] = useState("50");
  const [requireEmail, setRequireEmail] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>("MANUAL");
  const [preview, setPreview] = useState<{ notes: string[]; spec: JobSpec; usedLlm: boolean } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getNexusClientHeaders();
      const [jobsRes, prospectsRes, podsRes] = await Promise.all([
        fetch("/api/nexus/prospects/jobs", { headers, cache: "no-store" }),
        fetch(`/api/nexus/prospects?status=${encodeURIComponent(filter)}&limit=100`, {
          headers,
          cache: "no-store",
        }),
        fetch("/api/nexus/pods", { headers, cache: "no-store" }),
      ]);

      if (!jobsRes.ok) throw new Error(`jobs: ${jobsRes.status}`);
      const jobsPayload = (await jobsRes.json()) as {
        jobs: JobRow[];
        counts: Record<string, number>;
        llmAvailable: boolean;
      };
      setJobs(jobsPayload.jobs ?? []);
      setCounts(jobsPayload.counts ?? {});
      setLlmAvailable(Boolean(jobsPayload.llmAvailable));

      if (prospectsRes.ok) {
        const payload = (await prospectsRes.json()) as {
          prospects: ProspectRow[];
          counts: Record<string, number>;
        };
        setProspects(payload.prospects ?? []);
        if (payload.counts) setCounts(payload.counts);
      }

      if (podsRes.ok) {
        const payload = (await podsRes.json()) as { pods: PodOption[] };
        setPods(payload.pods ?? []);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const analyze = async () => {
    setBusy("analyze");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/nexus/prospects/parse", {
        method: "POST",
        headers: { ...getNexusClientHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await res.json()) as {
        spec?: JobSpec;
        notes?: string[];
        usedLlm?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.spec) throw new Error(payload.error ?? "No se pudo analizar el texto.");
      setPreview({ notes: payload.notes ?? [], spec: payload.spec, usedLlm: Boolean(payload.usedLlm) });
      setMaxAgeDays(String(payload.spec.rules.maxAgeDays));
      setMinConfidence(String(payload.spec.rules.minConfidence));
      setRequireEmail(payload.spec.rules.requireEmail);
      setSelectedDoors(payload.spec.doors);
      setSelectedSources(payload.spec.sources);
      setTargetUrls(payload.spec.targetUrls.join("\n"));
      if (payload.spec.query) setQuery(payload.spec.query);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const createJob = async (runNow: boolean) => {
    setBusy(runNow ? "create-run" : "create");
    setError(null);
    setNotice(null);
    try {
      const body =
        mode === "TEXT"
          ? { text, podId: podId || null, schedule }
          : {
              podId: podId || null,
              schedule,
              query,
              spec: {
                query,
                doors: selectedDoors,
                sources: selectedSources,
                targetUrls: targetUrls
                  .split(/\s+/)
                  .map((value) => value.trim())
                  .filter(Boolean),
                rules: {
                  maxAgeDays: Number.parseInt(maxAgeDays, 10) || 0,
                  minConfidence: Number.parseInt(minConfidence, 10) || 0,
                  requireEmail,
                },
              },
            };

      const res = await fetch("/api/nexus/prospects/jobs", {
        method: "POST",
        headers: { ...getNexusClientHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, label: query.slice(0, 120) || undefined }),
      });
      const payload = (await res.json()) as { job?: JobRow; error?: string };
      if (!res.ok || !payload.job) throw new Error(payload.error ?? "No se pudo crear el job.");

      setShowNew(false);
      setPreview(null);
      setNotice("Job creado.");
      setFilter("NEW");
      await loadAll();

      if (runNow) await runJob(payload.job.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const runJob = async (jobId: string) => {
    setBusy(`run:${jobId}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/nexus/prospects/jobs/${jobId}/run`, {
        method: "POST",
        headers: getNexusClientHeaders(),
      });
      const payload = (await res.json()) as {
        status?: string;
        candidates?: number;
        inserted?: number;
        skipped?: number;
        warnings?: string[];
        error?: string;
      };
      if (!res.ok && !payload.status) throw new Error(payload.error ?? `Error ${res.status}`);
      setNotice(
        `Corrida ${payload.status ?? "?"}: ${payload.candidates ?? 0} candidatos · ${payload.inserted ?? 0} nuevos · ${
          payload.skipped ?? 0
        } descartados${payload.warnings?.length ? ` · avisos: ${payload.warnings.slice(0, 2).join(" / ")}` : ""}`,
      );
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const setJobStatus = async (jobId: string, status: "QUEUED" | "PAUSED") => {
    setBusy(`status:${jobId}`);
    setError(null);
    try {
      const res = await fetch(`/api/nexus/prospects/jobs/${jobId}`, {
        method: "PATCH",
        headers: { ...getNexusClientHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? "No se pudo actualizar.");
      }
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const approve = async (prospectId: string) => {
    setBusy(`approve:${prospectId}`);
    setError(null);
    try {
      const res = await fetch(`/api/nexus/prospects/${prospectId}/approve`, {
        method: "POST",
        headers: { ...getNexusClientHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await res.json()) as { url?: string | null; warning?: string; error?: string };
      if (!res.ok) throw new Error(payload.error ?? "No se pudo aprobar.");
      if (payload.url) {
        setNotice(`Aprobado. Link de radar: ${payload.url}`);
        await navigator.clipboard?.writeText(payload.url).catch(() => undefined);
        setCopied(payload.url);
      } else {
        setNotice(payload.warning ?? "Aprobado (sin link: el prospecto no tiene pod).");
      }
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const reject = async (prospectId: string) => {
    const reason = window.prompt("Motivo del rechazo (queda registrado):");
    if (!reason || !reason.trim()) return;
    setBusy(`reject:${prospectId}`);
    setError(null);
    try {
      const res = await fetch(`/api/nexus/prospects/${prospectId}/reject`, {
        method: "POST",
        headers: { ...getNexusClientHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "No se pudo rechazar.");
      setNotice("Prospecto rechazado con motivo.");
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const toggleDoor = (door: string) => {
    setSelectedDoors((current) =>
      current.includes(door) ? current.filter((value) => value !== door) : [...current, door],
    );
  };

  const toggleSource = (source: string) => {
    setSelectedSources((current) =>
      current.includes(source) ? current.filter((value) => value !== source) : [...current, source],
    );
  };

  return (
    // `flex-1 min-h-0 overflow-y-auto`: el hub es full-screen con `overflow-hidden`;
    // sin este contenedor, en móvil (y con muchas tarjetas) el final del panel
    // quedaba cortado y sin scroll.
    <div className="flex-1 min-h-0 space-y-5 overflow-y-auto p-4 md:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <Radar className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-amber-300">Prospección</p>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-zinc-400">
              Recolecta prospectos de fuentes públicas, con reglas explícitas (edad, confianza, dominios) y
              aprobación humana. Respeta <code className="text-zinc-300">robots.txt</code>, no toca LinkedIn y
              no envía correos: al aprobar sólo se genera el link del radar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono text-zinc-400">
            {counts.NEW ?? 0} por revisar
          </span>
          <button
            type="button"
            onClick={() => {
              setShowNew((open) => !open);
              setPreview(null);
            }}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-200 hover:bg-amber-500/20"
          >
            {showNew ? "Cancelar" : "+ Nueva búsqueda"}
          </button>
        </div>
      </header>

      {!llmAvailable && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Sin <code>OPENAI_API_KEY</code> el extractor usa sólo reglas: encuentra correos literales en la fuente,
          pero no nombres ni cargos redactados. No se simula información.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] text-rose-300">{error}</p>
      )}
      {notice && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-200">
          {notice}
        </p>
      )}

      {showNew && (
        <section className="space-y-4 rounded-xl border border-white/10 bg-[#0C0C10] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("TEXT")}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider ${
                mode === "TEXT"
                  ? "border border-amber-500/40 bg-amber-500/15 text-amber-200"
                  : "border border-white/10 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="mr-1 inline h-3 w-3" /> Texto → búsqueda
            </button>
            <button
              type="button"
              onClick={() => setMode("RULES")}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider ${
                mode === "RULES"
                  ? "border border-amber-500/40 bg-amber-500/15 text-amber-200"
                  : "border border-white/10 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Search className="mr-1 inline h-3 w-3" /> Reglas manuales
            </button>
          </div>

          {mode === "TEXT" ? (
            <div className="space-y-2">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={3}
                placeholder="Ej. Family offices en CDMX o Guadalajara que hayan comprado hoteles en los últimos 6 meses, con correo, revisar semanalmente."
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500/40"
              />
              <button
                type="button"
                onClick={() => void analyze()}
                disabled={busy === "analyze" || !text.trim()}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-200 hover:bg-white/10 disabled:opacity-40"
              >
                {busy === "analyze" ? "Analizando…" : "Analizar texto"}
              </button>
              {preview && (
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Esto se entendió {preview.usedLlm ? "· con modelo" : "· reglas"}
                  </p>
                  <ul className="space-y-1 text-[11px] text-zinc-300">
                    {preview.notes.map((note, index) => (
                      <li key={index}>· {note}</li>
                    ))}
                  </ul>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Consulta"
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500/40"
                    />
                    <input
                      value={targetUrls}
                      onChange={(event) => setTargetUrls(event.target.value)}
                      placeholder="Targets (una URL por línea)"
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500/40"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Consulta (ej. hotel acquisition Mexico family office)"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500/40"
                />
                <input
                  value={targetUrls}
                  onChange={(event) => setTargetUrls(event.target.value)}
                  placeholder="Targets: https://ejemplo.com/team (separadas por espacio o salto)"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500/40"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Fuentes</p>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_TYPES.map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => toggleSource(source)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                        selectedSources.includes(source)
                          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                          : "border border-white/10 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {SOURCE_LABEL[source] ?? source}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Puertas</p>
                <div className="flex flex-wrap gap-2">
                  {DOORS.map((door) => (
                    <button
                      key={door}
                      type="button"
                      onClick={() => toggleDoor(door)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                        selectedDoors.includes(door)
                          ? "border border-sky-500/40 bg-sky-500/10 text-sky-200"
                          : "border border-white/10 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {door}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Edad máx. (días)</span>
              <input
                value={maxAgeDays}
                onChange={(event) => setMaxAgeDays(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none focus:border-amber-500/40"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Confianza mín.</span>
              <input
                value={minConfidence}
                onChange={(event) => setMinConfidence(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none focus:border-amber-500/40"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Frecuencia</span>
              <select
                value={schedule}
                onChange={(event) => setSchedule(event.target.value as Schedule)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none focus:border-amber-500/40"
              >
                <option value="MANUAL">Manual</option>
                <option value="HOURLY">Cada hora</option>
                <option value="DAILY">Diario</option>
                <option value="WEEKLY">Semanal</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Deal Pod</span>
              <select
                value={podId}
                onChange={(event) => setPodId(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none focus:border-amber-500/40"
              >
                <option value="">Sin pod</option>
                {pods.map((pod) => (
                  <option key={pod.id} value={pod.id}>
                    {pod.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={requireEmail}
                onChange={(event) => setRequireEmail(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
              />
              <span className="text-[10px] text-zinc-400">Sólo con correo</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void createJob(false)}
              disabled={busy === "create" || (mode === "TEXT" ? !text.trim() : !query.trim())}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-200 hover:bg-amber-500/20 disabled:opacity-40"
            >
              {busy === "create" ? "Creando…" : "Guardar job"}
            </button>
            <button
              type="button"
              onClick={() => void createJob(true)}
              disabled={busy === "create-run" || (mode === "TEXT" ? !text.trim() : !query.trim())}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
            >
              {busy === "create-run" ? "Ejecutando…" : "Guardar y ejecutar"}
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Búsquedas ({jobs.length})
            </p>
            {jobs.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-[#0C0C10] p-6 text-center text-xs text-zinc-500">
                Aún no hay búsquedas. Crea una con “Nueva búsqueda”.
              </p>
            )}
            <div className="space-y-2">
              {jobs.map((job) => {
                const last = job.stats?.lastRun;
                return (
                  <article key={job.id} className="rounded-xl border border-white/10 bg-[#0C0C10] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                              STATUS_STYLE[job.status] ?? "border-white/10 text-zinc-400"
                            }`}
                          >
                            {job.status}
                          </span>
                          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                            {job.schedule}
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                            {job.mode === "TEXT" ? "text-to-scrap" : "reglas"}
                          </span>
                        </div>
                        <h3 className="mt-1.5 truncate text-sm font-semibold text-zinc-100">{job.label}</h3>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                          {job.spec.query || job.query}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void runJob(job.id)}
                          disabled={busy === `run:${job.id}` || job.status === "PAUSED"}
                          className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
                        >
                          {busy === `run:${job.id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          Ejecutar
                        </button>
                        <button
                          type="button"
                          onClick={() => void setJobStatus(job.id, job.status === "PAUSED" ? "QUEUED" : "PAUSED")}
                          disabled={busy === `status:${job.id}`}
                          className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:bg-white/5 disabled:opacity-40"
                        >
                          {job.status === "PAUSED" ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          {job.status === "PAUSED" ? "Reactivar" : "Pausar"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-500">
                      <span>edades ≤ {job.maxAgeDays || "∞"} d</span>
                      <span>confianza ≥ {job.minConfidence}</span>
                      <span>fuentes: {job.spec.sources.map((s) => SOURCE_LABEL[s] ?? s).join(" · ") || "—"}</span>
                      <span>corridas: {job.runs}</span>
                      <span>próxima: {dateLabel(job.nextRunAt)}</span>
                    </div>

                    {last && (
                      <p className="mt-2 text-[10px] text-zinc-500">
                        Última {dateLabel(last.at)}: {last.candidates} candidatos · {last.inserted} nuevos ·{" "}
                        {last.skipped} descartados · extractor {last.llm ? "modelo" : "reglas"}
                        {last.perSource.some((entry) => entry.warning)
                          ? ` · avisos: ${last.perSource
                              .filter((entry) => entry.warning)
                              .map((entry) => `${entry.source}: ${entry.warning}`)
                              .join(" / ")
                              .slice(0, 220)}`
                          : ""}
                      </p>
                    )}
                    {job.lastError && (
                      <p className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-[10px] text-rose-300">
                        {job.lastError}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Bandeja de aprobación
              </p>
              <div className="flex gap-1">
                {["NEW", "APPROVED", "REJECTED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                      filter === status
                        ? "border border-white/20 bg-white/10 text-zinc-100"
                        : "border border-white/5 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {status} ({counts[status] ?? 0})
                  </button>
                ))}
              </div>
            </div>

            {prospects.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-[#0C0C10] p-6 text-center text-xs text-zinc-500">
                Nada en esta bandeja. Ejecuta una búsqueda para recolectar.
              </p>
            ) : (
              <div className="space-y-2">
                {prospects.map((prospect) => (
                  <article key={prospect.id} className="rounded-xl border border-white/10 bg-[#0C0C10] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                              STATUS_STYLE[prospect.status] ?? "border-white/10 text-zinc-400"
                            }`}
                          >
                            {prospect.status}
                          </span>
                          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                            {prospect.confidence}% · {prospect.sourceType}
                          </span>
                          {prospect.door && (
                            <span className="rounded-md border border-sky-500/20 bg-sky-500/5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-sky-300">
                              {prospect.door}
                            </span>
                          )}
                          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                            {prospect.extraction}
                          </span>
                        </div>
                        <h3 className="mt-1.5 text-sm font-semibold text-zinc-100">
                          {prospect.personName ?? prospect.company ?? prospect.email ?? "Sin nombre"}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-zinc-400">
                          {[prospect.role, prospect.company].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {prospect.email ?? "sin correo verificado en la fuente"}
                          {prospect.publisher ? ` · ${prospect.publisher}` : ""}
                          {prospect.publishedAt ? ` · ${dateLabel(prospect.publishedAt)}` : ""}
                        </p>
                        <a
                          href={prospect.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[10px] text-sky-300 hover:text-sky-200"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{prospect.sourceTitle ?? prospect.sourceUrl}</span>
                        </a>
                      </div>

                      {prospect.status === "NEW" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void approve(prospect.id)}
                            disabled={busy === `approve:${prospect.id}`}
                            className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
                          >
                            {busy === `approve:${prospect.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => void reject(prospect.id)}
                            disabled={busy === `reject:${prospect.id}`}
                            className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:bg-white/5 disabled:opacity-40"
                          >
                            <X className="h-3 w-3" />
                            Rechazar
                          </button>
                        </div>
                      )}

                      {prospect.status !== "NEW" && (
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(prospect.sourceUrl).catch(() => undefined);
                            setCopied(prospect.sourceUrl);
                          }}
                          className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-mono text-zinc-400 hover:bg-white/5"
                        >
                          {copied === prospect.sourceUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          fuente
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
