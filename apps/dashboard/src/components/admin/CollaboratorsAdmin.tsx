"use client";

/**
 * 🧾 Collaborators Admin — Providisioning queue management.
 * Lists collaborators with approve/reject actions wired to server actions.
 */

import React, { useState, useTransition } from "react";
import { Clock, CheckCircle2, XCircle, UserX, RefreshCw } from "lucide-react";
import { approveCollaboratorAction, rejectCollaboratorAction } from "@/app/admin/collaborators/actions";

export interface CollaboratorRow {
  id: number;
  name: string;
  email: string;
  whatsappPhone: string | null;
  role: string;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "DISABLED";
  createdAt: string;
  statusChangedAt: string | null;
  lastAccessAt: string | null;
}

const STATUS_LABEL: Record<CollaboratorRow["status"], { label: string; className: string }> = {
  PENDING: { label: "PENDIENTE", className: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  ACTIVE: { label: "ACTIVO", className: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  REJECTED: { label: "RECHAZADO", className: "bg-rose-500/10 border-rose-500/30 text-rose-400" },
  DISABLED: { label: "DESHABILITADO", className: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400" },
};

interface CollaboratorsAdminProps {
  rows: CollaboratorRow[];
}

export function CollaboratorsAdmin({ rows }: CollaboratorsAdminProps) {
  const [actingId, setActingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const pending = rows.filter((r) => r.status === "PENDING");
  const processed = rows.filter((r) => r.status !== "PENDING");

  const run = async (id: number, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setActingId(id);
    setNotice(null);
    startTransition(async () => {
      const res = await fn();
      setNotice(
        res.success
          ? { type: "success", message: "Aprovisionamiento actualizado correctamente." }
          : { type: "error", message: res.error || "Error al actualizar el aprovisionamiento." }
      );
      setActingId(null);
    });
  };

  return (
    <div className="space-y-8">
      {notice && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            notice.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* ── Pending queue ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">Cola de Aprobación</h3>
          <span className="text-[10px] text-zinc-500 font-mono uppercase">{pending.length}</span>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
            <RefreshCw className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Sin aprovisionamientos pendientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#0e0e16]/80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="p-3 font-semibold">Colaborador</th>
                  <th className="p-3 font-semibold">Contacto</th>
                  <th className="p-3 font-semibold">Rol</th>
                  <th className="p-3 font-semibold">Solicitado</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => {
                  const busy = isPending && actingId === r.id;
                  return (
                    <tr key={r.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="p-3">
                        <div className="font-semibold text-white">{r.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">#{r.id}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-zinc-200">{r.email}</div>
                        <div className="text-[10px] text-zinc-500">{r.whatsappPhone || "—"}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono text-[10px]">
                          {r.role}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full border font-mono text-[10px] font-semibold ${STATUS_LABEL[r.status].className}`}>
                          {STATUS_LABEL[r.status].label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => run(r.id, () => approveCollaboratorAction(r.id))}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[11px] disabled:opacity-40 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {busy ? "..." : "Aprobar"}
                          </button>
                          <button
                            onClick={() => run(r.id, () => rejectCollaboratorAction(r.id))}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-semibold text-[11px] disabled:opacity-40 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {busy ? "..." : "Rechazar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Processed (approved / rejected / disabled) ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <UserX className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-white tracking-tight">Historial</h3>
          <span className="text-[10px] text-zinc-500 font-mono uppercase">{processed.length}</span>
        </div>

        {processed.length === 0 ? (
          <p className="text-xs text-zinc-500">Sin registros procesados.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#0e0e16]/80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="p-3 font-semibold">Colaborador</th>
                  <th className="p-3 font-semibold">Rol</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold">Resuelto</th>
                </tr>
              </thead>
              <tbody>
                {processed.slice(0, 50).map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="p-3">
                      <div className="font-semibold text-zinc-200">{r.name}</div>
                      <div className="text-[10px] text-zinc-500">{r.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono text-[10px]">
                        {r.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full border font-mono text-[10px] font-semibold ${STATUS_LABEL[r.status].className}`}>
                        {STATUS_LABEL[r.status].label}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400">{r.statusChangedAt ? new Date(r.statusChangedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}