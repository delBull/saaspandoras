"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Package, ShieldCheck } from "lucide-react";
import { getNexusClientHeaders } from "@/lib/nexus/client-auth-headers";
import { PodAccessRequests } from "./PodAccessRequests";

interface PodRoom {
  publicId: string;
  status: string;
}

interface PodLink {
  id: string;
  code: string;
  door: string | null;
  targetLabel: string | null;
  targetOrg: string | null;
  targetRole: string | null;
  opens: number;
  lastOpen: string | null;
}

interface Pod {
  id: string;
  code: string;
  displayName: string;
  status: string;
  confidentiality: string;
  feeEntity: string | null;
  feePct: string | number | null;
  currency: string;
  createdBy: string | null;
  createdAt: string;
  linkCount: number;
  links: PodLink[];
  rooms: PodRoom[];
}

/**
 * Deal Pods — mini-tenants de oportunidad.
 *
 * Solo visible para SUPER_ADMIN. Muestra el pod, su sala, su landing y cuántos
 * links de radar tiene. No expone datos del activo: eso vive detrás del NDA.
 */
export function OperationsPodsTab() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState<string | null>(null);
  const [showNewPod, setShowNewPod] = useState(false);
  const [newPod, setNewPod] = useState({ code: "", displayName: "", confidentiality: "OFF_MARKET", feeEntity: "", feePct: "3" });
  const [creatingPod, setCreatingPod] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [seedPodId, setSeedPodId] = useState<string | null>(null);
  const [seed, setSeed] = useState({ targetLabel: "", targetOrg: "", targetRole: "", door: "BROKER" });
  const [creatingSeed, setCreatingSeed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Abre la sala en modo operador: enlace firmado de 10 minutos, sólo lectura.
   * No registra firmante ni envía correos; sirve para revisar sin firmar.
   */
  const openPreview = async (podId: string, publicId: string) => {
    setPreviewBusy(publicId);
    setError(null);
    try {
      const res = await fetch(`/api/nexus/pods/${podId}/preview`, {
        method: "POST",
        headers: { ...getNexusClientHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const payload = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !payload.url) throw new Error(payload.error ?? "No se pudo abrir la sala.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPreviewBusy(null);
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/nexus/pods", {
        headers: getNexusClientHeaders(),
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudieron cargar los Deal Pods.");
        return;
      }
      setPods(Array.isArray(data.pods) ? data.pods : []);
      setError(null);
    } catch {
      setError("Error de red al cargar los Deal Pods.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createPod = async () => {
    setCreatingPod(true);
    setFormError(null);
    try {
      const res = await fetch("/api/nexus/pods", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getNexusClientHeaders() },
        credentials: "include",
        body: JSON.stringify(newPod),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear el pod.");
        return;
      }
      setShowNewPod(false);
      setNewPod({ code: "", displayName: "", confidentiality: "OFF_MARKET", feeEntity: "", feePct: "3" });
      await load();
    } catch {
      setFormError("Error de red al crear el pod.");
    } finally {
      setCreatingPod(false);
    }
  };

  const updateStatus = async (podId: string, status: string) => {
    await fetch(`/api/nexus/pods/${podId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getNexusClientHeaders() },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const createSeed = async (podId: string) => {
    setCreatingSeed(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/nexus/pods/${podId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getNexusClientHeaders() },
        credentials: "include",
        body: JSON.stringify(seed),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear la semilla.");
        return;
      }
      setSeedPodId(null);
      setSeed({ targetLabel: "", targetOrg: "", targetRole: "", door: "BROKER" });
      await load();
    } catch {
      setFormError("Error de red al crear la semilla.");
    } finally {
      setCreatingSeed(false);
    }
  };

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
            <Package className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-purple-300">Deal Pods</p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
              Oportunidades montadas como unidad propia: landing, deal room con NDA, radar y cierre.
              No son tenants: viven en la organización actual y se aíslan por pod.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono text-zinc-400">
            {loading ? "…" : `${pods.length} pod${pods.length === 1 ? "" : "s"}`}
          </span>
          <button
            type="button"
            onClick={() => setShowNewPod((open) => !open)}
            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-purple-200 hover:bg-purple-500/20"
          >
            {showNewPod ? "Cancelar" : "+ Nuevo pod"}
          </button>
        </div>
      </div>

      {showNewPod && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-[#0C0C10] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Nuevo Deal Pod</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={newPod.code}
              onChange={(event) => setNewPod({ ...newPod, code: event.target.value })}
              placeholder="Código (ej. village)"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-purple-500/40"
            />
            <input
              value={newPod.displayName}
              onChange={(event) => setNewPod({ ...newPod, displayName: event.target.value })}
              placeholder="Nombre visible"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-purple-500/40"
            />
            <select
              value={newPod.confidentiality}
              onChange={(event) => setNewPod({ ...newPod, confidentiality: event.target.value })}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none focus:border-purple-500/40"
            >
              <option value="OFF_MARKET">Off-market</option>
              <option value="CONFIDENTIAL">Confidencial</option>
              <option value="PUBLIC">Público</option>
            </select>
            <input
              value={newPod.feeEntity}
              onChange={(event) => setNewPod({ ...newPod, feeEntity: event.target.value })}
              placeholder="Entidad que cobra"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-purple-500/40"
            />
            <input
              value={newPod.feePct}
              onChange={(event) => setNewPod({ ...newPod, feePct: event.target.value })}
              placeholder="Comisión %"
              inputMode="decimal"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-purple-500/40"
            />
          </div>
          <button
            type="button"
            onClick={() => void createPod()}
            disabled={creatingPod || !newPod.code.trim() || !newPod.displayName.trim()}
            className="w-full rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-purple-200 hover:bg-purple-500/20 disabled:opacity-40"
          >
            {creatingPod ? "Creando…" : "Crear pod"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] text-rose-300">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loading && pods.length === 0 && !error && (
        <p className="rounded-xl border border-white/10 bg-[#0C0C10] p-6 text-center text-xs text-zinc-500">
          No hay Deal Pods todavía.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {pods.map((pod) => (
          <article key={pod.id} className="space-y-4 rounded-xl border border-white/10 bg-[#0C0C10] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{pod.code}</p>
                <h3 className="mt-1 truncate text-base font-semibold text-white">{pod.displayName}</h3>
              </div>
              <select
                value={pod.status}
                onChange={(event) => void updateStatus(pod.id, event.target.value)}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300 outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CLOSED_WON">CLOSED_WON</option>
                <option value="CLOSED_LOST">CLOSED_LOST</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <dt className="text-zinc-500">Confidencialidad</dt>
                <dd className="text-zinc-300">{pod.confidentiality}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Comisión</dt>
                <dd className="text-zinc-300">
                  {pod.feePct ? `${pod.feePct}% ${pod.currency}` : "sin definir"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-zinc-500">Entidad</dt>
                <dd className="text-zinc-300">{pod.feeEntity ?? "sin definir"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Radar</dt>
                <dd className="text-zinc-300">{pod.linkCount} links</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Creado</dt>
                <dd className="text-zinc-300">
                  {new Date(pod.createdAt).toLocaleDateString("es-MX")}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
              <Link
                href={`/pitch/${pod.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:bg-white/10"
              >
                Landing <ExternalLink className="h-3 w-3" />
              </Link>
              {pod.rooms.map((room) => (
                <button
                  key={room.publicId}
                  type="button"
                  onClick={() => void openPreview(pod.id, room.publicId)}
                  disabled={previewBusy === room.publicId}
                  title="Abrir en solo lectura durante 10 minutos (no te registra como firmante)"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-purple-200 hover:bg-purple-500/20 disabled:opacity-50"
                >
                  {previewBusy === room.publicId ? "Abriendo…" : `Ver ${room.publicId} · ${room.status}`}
                  <ExternalLink className="h-3 w-3" />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSeedPodId(seedPodId === pod.id ? null : pod.id)}
                className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:bg-white/10"
              >
                {seedPodId === pod.id ? "Cancelar semilla" : "+ Agregar semilla"}
              </button>
            </div>

            {seedPodId === pod.id && (
              <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={seed.targetLabel}
                    onChange={(event) => setSeed({ ...seed, targetLabel: event.target.value })}
                    placeholder="Objetivo (ej. Hilton Grand Vacations)"
                    className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 text-[10px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500/40"
                  />
                  <input
                    value={seed.targetOrg}
                    onChange={(event) => setSeed({ ...seed, targetOrg: event.target.value })}
                    placeholder="Organización"
                    className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 text-[10px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500/40"
                  />
                  <input
                    value={seed.targetRole}
                    onChange={(event) => setSeed({ ...seed, targetRole: event.target.value })}
                    placeholder="Cargo (ej. MD Capital Markets)"
                    className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 text-[10px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500/40"
                  />
                  <select
                    value={seed.door}
                    onChange={(event) => setSeed({ ...seed, door: event.target.value })}
                    className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 text-[10px] text-zinc-200 outline-none focus:border-emerald-500/40"
                  >
                    <option value="CONSOLIDATOR">Consolidador</option>
                    <option value="BROKER">Broker</option>
                    <option value="PATIENT_CAPITAL">Capital paciente</option>
                    <option value="SOVEREIGN">Soberano</option>
                    <option value="MX_FAMILY">Family office MX</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => void createSeed(pod.id)}
                  disabled={creatingSeed || !seed.targetLabel.trim()}
                  className="w-full rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
                >
                  {creatingSeed ? "Creando…" : "Crear link de radar"}
                </button>
              </div>
            )}

            {formError && <p className="text-[10px] text-rose-300">{formError}</p>}

            {pod.links.length > 0 && (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Semillas · radar</p>
                  <span className="text-[9px] font-mono text-zinc-600">
                    {pod.links.reduce((total, link) => total + link.opens, 0)} aperturas
                  </span>
                </div>
                <div className="space-y-1">
                  {pod.links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] text-zinc-200">
                          {link.targetLabel ?? link.code}
                          {link.door && <span className="ml-1.5 text-[9px] text-zinc-600">{link.door}</span>}
                        </p>
                        <p className="truncate text-[9px] font-mono text-zinc-600">
                          /l/{link.code} · {link.opens} {link.opens === 1 ? "apertura" : "aperturas"}
                          {link.lastOpen
                            ? ` · ${new Date(link.lastOpen).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/l/${link.code}`);
                            setCopiedCode(link.code);
                            setTimeout(() => setCopiedCode(null), 1800);
                          } catch {
                            /* portapapeles no disponible */
                          }
                        }}
                        className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white"
                      >
                        {copiedCode === link.code ? "Copiado" : "Copiar link"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <PodAccessRequests podId={pod.id} />

            <p className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-600">
              <ShieldCheck className="h-3 w-3" /> Información del activo detrás de NDA
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
