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
}

const KIND_LABEL: Record<string, string> = {
  email_campaign: "Campaña de email",
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

  const resolve = async (id: string, action: "APPROVED" | "REJECTED") => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/nexus/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data?.error || `No se pudo resolver (${res.status}).`);
        return;
      }
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
              <p className="mt-1 text-[11px] text-zinc-500">
                Propuso {approval.proposerName} ·{" "}
                {new Date(approval.createdAt).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}{" "}
                · {approval.resourceScope}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void resolve(approval.id, "REJECTED")}
                disabled={busy === approval.id}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => void resolve(approval.id, "APPROVED")}
                disabled={busy === approval.id}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {busy === approval.id ? "Resolviendo…" : "Aprobar"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
