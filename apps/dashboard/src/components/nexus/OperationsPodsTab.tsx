"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Package, ShieldCheck } from "lucide-react";
import { getNexusClientHeaders } from "@/lib/nexus/client-auth-headers";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        if (!cancelled) setPods(Array.isArray(data.pods) ? data.pods : []);
      } catch {
        if (!cancelled) setError("Error de red al cargar los Deal Pods.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono text-zinc-400">
          {loading ? "…" : `${pods.length} pod${pods.length === 1 ? "" : "s"}`}
        </span>
      </div>

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
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300">
                {pod.status}
              </span>
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
                <Link
                  key={room.publicId}
                  href={`/deal/${room.publicId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-purple-200 hover:bg-purple-500/20"
                >
                  Deal Room {room.publicId} · {room.status} <ExternalLink className="h-3 w-3" />
                </Link>
              ))}
            </div>

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

            <p className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-600">
              <ShieldCheck className="h-3 w-3" /> Información del activo detrás de NDA
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
