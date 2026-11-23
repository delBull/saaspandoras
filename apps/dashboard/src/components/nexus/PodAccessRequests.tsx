"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Mail, UserRound, X } from "lucide-react";
import { getNexusClientHeaders } from "@/lib/nexus/client-auth-headers";

interface AccessRequest {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: string | null;
  message: string | null;
  status: string;
  source: string;
  srcCode: string | null;
  referrer: string | null;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

/**
 * Solicitudes de acceso de un Deal Pod.
 *
 * Categoría propia del pod: no lee ni escribe el CRM general. Aprobar es lo que
 * crea al firmante y envía el magic link; rechazar deja motivo y auditoría.
 */
export function PodAccessRequests({ podId }: { podId: string }) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nexus/pods/${podId}/access-requests`, {
        headers: getNexusClientHeaders(),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json()) as { requests: AccessRequest[]; pending: number };
      setRequests(payload.requests ?? []);
      setPending(payload.pending ?? 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [podId]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (requestId: string, action: "approve" | "reject") => {
    let note: string | null = null;
    if (action === "reject") {
      note = window.prompt("Motivo del rechazo (queda en la auditoría):");
      if (!note || !note.trim()) return;
    }

    setBusy(`${action}:${requestId}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/nexus/pods/${podId}/access-requests/${requestId}`, {
        method: "POST",
        headers: { ...getNexusClientHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const payload = (await res.json()) as {
        error?: string;
        status?: string;
        magicSent?: boolean;
        alreadyDecided?: boolean;
      };
      if (!res.ok) throw new Error(payload.error ?? "No se pudo decidir.");

      if (action === "approve") {
        setNotice(
          payload.magicSent
            ? "Autorizado: se registró al firmante y se envió el enlace."
            : "Autorizado, pero el enlace NO se pudo enviar. Revisa Resend y reenvíalo manualmente.",
        );
      } else {
        setNotice("Solicitud rechazada con motivo.");
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 border-t border-white/5 pt-3 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
        <Loader2 className="h-3 w-3 animate-spin" /> Solicitudes de acceso
      </p>
    );
  }

  if (requests.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-white/5 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Solicitudes de acceso
        </p>
        <span
          className={`rounded-md border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
            pending > 0
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-white/10 bg-white/5 text-zinc-500"
          }`}
        >
          {pending} pendiente{pending === 1 ? "" : "s"}
        </span>
      </div>

      {error && <p className="text-[10px] text-rose-300">{error}</p>}
      {notice && <p className="text-[10px] text-emerald-300">{notice}</p>}

      <div className="space-y-1.5">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-lg border border-white/5 bg-black/30 px-2.5 py-2"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-[11px] text-zinc-200">
                  <UserRound className="h-3 w-3 shrink-0 text-zinc-500" />
                  {request.name ?? request.email}
                  {request.company && (
                    <span className="text-[10px] text-zinc-500">· {request.company}</span>
                  )}
                </p>
                <p className="flex items-center gap-1.5 truncate text-[9px] font-mono text-zinc-600">
                  <Mail className="h-2.5 w-2.5 shrink-0" />
                  {request.email}
                  {request.role ? ` · ${request.role}` : ""}
                </p>
                <p className="text-[9px] font-mono text-zinc-600">
                  {request.srcCode ? `semilla /l/${request.srcCode}` : request.source}
                  {request.referrer ? ` · ${request.referrer.slice(0, 48)}` : ""} ·{" "}
                  {new Date(request.createdAt).toLocaleString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {request.message && (
                  <p className="mt-1 line-clamp-2 text-[10px] text-zinc-500">{request.message}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                    request.status === "APPROVED"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : request.status === "REJECTED"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {request.status}
                </span>
                {request.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => void decide(request.id, "approve")}
                      disabled={busy === `approve:${request.id}`}
                      className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                      {busy === `approve:${request.id}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Autorizar
                    </button>
                    <button
                      type="button"
                      onClick={() => void decide(request.id, "reject")}
                      disabled={busy === `reject:${request.id}`}
                      className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-zinc-400 hover:bg-white/5 disabled:opacity-40"
                    >
                      <X className="h-3 w-3" />
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
