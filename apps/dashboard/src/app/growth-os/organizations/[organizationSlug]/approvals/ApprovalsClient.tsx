"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Approval {
  id: string;
  what: string;
  why: string;
  riskLevel: string;
  capabilityRequired: string;
  resourceScope: string;
  proposerName: string;
  createdAt: string;
  posts?: Array<{ channel: string; text: string }>;
}

const KIND_LABEL: Record<string, string> = {
  email_campaign: "Campaña de email",
  "community.publish_post": "Publicación de comunidad",
};

function labelFor(what: string): string {
  const prefix = what.split(":")[0] ?? "";
  return KIND_LABEL[prefix] ?? what;
}

function riskColor(risk: string): string {
  switch (risk) {
    case "CRITICAL":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "HIGH":
      return "border-orange-500/40 bg-orange-500/10 text-orange-300";
    case "MEDIUM":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default:
      return "border-zinc-500/40 bg-zinc-500/10 text-zinc-300";
  }
}

interface CommunityResult {
  status: string;
  published?: Array<{ channel: string; messageId: string }>;
  errors?: string[];
  reason?: string;
}

export default function ApprovalsClient({
  organizationSlug,
  approvals,
}: {
  organizationSlug: string;
  approvals: Approval[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Motivo del rechazo en un modal propio (no `window.prompt`): es la señal de
  // aprendizaje del agente y merece la identidad de la plataforma.
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const [reasonText, setReasonText] = useState("");

  const resolve = async (
    approval: Approval,
    action: "APPROVED" | "REJECTED",
    reason?: string | null,
  ) => {
    setBusy(approval.id);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/nexus/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: approval.id,
          action,
          reason: reason ?? null,
          // Contexto de ruta; la organización autorizada la resuelve el servidor
          // desde la sesión (portal) o la credencial (Nexus).
          organizationSlug,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data?.error || `No se pudo resolver (${res.status}).`);
        return;
      }

      const community = data.community as CommunityResult | null;
      if (action === "REJECTED") {
        setNotice("Rechazada. El motivo queda como señal para el agente.");
      } else if (community?.status === "EXECUTED") {
        const channels = (community.published ?? []).map((p) => `#${p.channel}`).join(", ");
        setNotice(`Publicada en ${channels || "el canal"}.`);
      } else if (community && community.status !== "EXECUTED") {
        setError(
          `Aprobada, pero la publicación quedó en ${community.status}` +
            (community.errors?.length ? `: ${community.errors[0]}` : "."),
        );
      } else {
        setNotice("Aprobada.");
      }

      setRejecting(null);
      setReasonText("");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Error de red.");
    } finally {
      setBusy(null);
    }
  };

  if (approvals.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <p className="text-sm font-semibold text-white">Sin aprobaciones pendientes</p>
        <p className="mt-1 text-[12px] text-zinc-500">
          Cuando alguien del equipo proponga una campaña o una acción que requiera autorización,
          aparecerá aquí.
        </p>
        <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-zinc-600">{organizationSlug}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[12px] text-emerald-200">
          {notice}
        </div>
      )}

      {approvals.map((approval) => (
        <div
          key={approval.id}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  {labelFor(approval.what)}
                </span>
                <span className={`rounded-md border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${riskColor(approval.riskLevel)}`}>
                  {approval.riskLevel}
                </span>
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                  {approval.capabilityRequired}
                </span>
              </div>
              <p className="mt-2 text-sm text-white">{approval.why}</p>

              {approval.posts && approval.posts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {approval.posts.map((post, index) => (
                    <div key={index} className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                        #{index + 1} · #{post.channel}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-zinc-300">
                        {post.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] text-zinc-500">
                Propuso {approval.proposerName} ·{" "}
                {new Date(approval.createdAt).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}{" "}
                · {approval.resourceScope}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejecting(approval);
                  setReasonText("");
                }}
                disabled={busy === approval.id}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => void resolve(approval, "APPROVED")}
                disabled={busy === approval.id}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {busy === approval.id ? "Resolviendo…" : "Aprobar"}
              </button>
            </div>
          </div>
        </div>
      ))}

      {rejecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0B10] p-6 shadow-2xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
              Pandora&apos;s · Governance
            </p>
            <h3 id="reject-title" className="mt-2 text-base font-semibold text-white">
              Rechazar propuesta
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">
              <span className="text-zinc-300">{rejecting.why}</span>
              <br />
              El motivo se guarda con la decisión y el agente lo lee en su siguiente corrida
              para no volver a proponer lo mismo.
            </p>

            <textarea
              autoFocus
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setRejecting(null);
                  setReasonText("");
                }
              }}
              rows={4}
              placeholder="Ej.: no menciones precios ni comparaciones con otros desarrollos."
              className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/25"
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-500">
                {reasonText.trim().length < 4 ? "Escribe un motivo (mín. 4 caracteres)." : "Se guardará con la decisión."}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejecting(null);
                    setReasonText("");
                  }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={reasonText.trim().length < 4 || busy === rejecting.id}
                  onClick={() => void resolve(rejecting, "REJECTED", reasonText.trim())}
                  className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-[11px] font-semibold text-red-200 hover:bg-red-500/25 disabled:opacity-40"
                >
                  {busy === rejecting.id ? "Rechazando…" : "Rechazar con este motivo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
