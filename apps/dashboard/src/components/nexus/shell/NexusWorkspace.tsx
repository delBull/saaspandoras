"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  AlertOctagon, 
  CheckSquare, 
  Activity, 
  BrainCircuit, 
  ChevronRight, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Webhook, 
  Building2, 
  Handshake, 
  TerminalSquare
} from "lucide-react";
import type { NexusAuthContext } from "@saasfly/shared";
import { getNexusClientHeaders } from "@/lib/nexus/client-auth-headers";
import type { TaskItem } from "../taskTypes";

interface NexusWorkspaceProps {
  auth: NexusAuthContext;
  sidebarOpen?: boolean;
  onAction?: (action: string) => void;
  tasks?: TaskItem[];
  onToggleTask?: (taskId: string) => void;
}

interface OverviewAttention {
  id: string;
  title: string;
  desc: string;
  type: string;
  action: string;
  at: string | null;
}

interface OverviewState {
  status: "loading" | "ready";
  /** null = no disponible (la fuente falló). Nunca se sustituye por 0. */
  openDeals: number | null;
  pendingApprovals: number | null;
  openIncidents: number | null;
  upcomingMeetings: number | null;
  attention: OverviewAttention[];
  activity: OverviewAttention[];
}

function relativeTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * Datos reales del Command Center.
 *
 * Regla de integridad: si una fuente falla, su métrica queda en `null` y la UI
 * muestra `—` con "no disponible". Nunca se cae a un número fijo ni a `[]`.
 */
function useOverview() {
  const [state, setState] = useState<OverviewState>({
    status: "loading",
    openDeals: null,
    pendingApprovals: null,
    openIncidents: null,
    upcomingMeetings: null,
    attention: [],
    activity: [],
  });

  useEffect(() => {
    let cancelled = false;

    const safeJson = async (url: string) => {
      try {
        const res = await fetch(url, {
          headers: getNexusClientHeaders(),
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    (async () => {
      const [approvalsRes, incidentsRes, dealsRes, agendaRes] = await Promise.all([
        safeJson("/api/nexus/approvals"),
        safeJson("/api/nexus/incidents"),
        safeJson("/api/nexus/deals?scope=all"),
        safeJson("/api/nexus/agenda"),
      ]);
      if (cancelled) return;

      const approvals = Array.isArray(approvalsRes?.approvals) ? approvalsRes.approvals : null;
      const incidents = Array.isArray(incidentsRes?.incidents) ? incidentsRes.incidents : null;
      const rooms = Array.isArray(dealsRes?.rooms) ? dealsRes.rooms : null;
      const meetings = Array.isArray(agendaRes?.meetings)
        ? agendaRes.meetings
        : Array.isArray(agendaRes?.items)
          ? agendaRes.items
          : null;

      const pending = approvals
        ? approvals
            .filter((item: any) => item?.status === "PENDING")
            .map((item: any) => ({
              id: String(item?.id ?? crypto.randomUUID()),
              title: String(item?.what ?? "Aprobación pendiente"),
              desc: [item?.proposerName, item?.capabilityRequired].filter(Boolean).join(" · ") || "Sin detalle",
              type: "Aprobación",
              action: "APPROVALS",
              at: item?.createdAt ?? null,
            }))
        : [];

      const open = incidents
        ? incidents
            .filter((item: any) => item?.status !== "RESOLVED")
            .map((item: any) => ({
              id: String(item?.id ?? crypto.randomUUID()),
              title: String(item?.title ?? "Incidente"),
              desc: String(item?.details ?? item?.source ?? "Sin detalle"),
              type: "Incidente",
              action: "ACTIVITY",
              at: item?.createdAt ?? null,
            }))
        : [];

      const meetingsList = meetings as any[] | null;
      const soon = meetingsList
        ? meetingsList.filter((m: any) => {
            const startsAt = m?.startsAt ? new Date(m.startsAt) : null;
            if (!startsAt || Number.isNaN(startsAt.getTime())) return false;
            const now = Date.now();
            const inSevenDays = now + 7 * 24 * 60 * 60 * 1000;
            return startsAt.getTime() >= now - 60 * 60 * 1000 && startsAt.getTime() <= inSevenDays;
          }).length
        : null;

      const activity = [...open, ...pending]
        .sort((a, b) => (b.at ? new Date(b.at).getTime() : 0) - (a.at ? new Date(a.at).getTime() : 0))
        .slice(0, 4);

      setState({
        status: "ready",
        openDeals: rooms
          ? rooms.filter((room: any) => room?.status !== "CLOSED" && room?.status !== "LOST").length
          : null,
        pendingApprovals: approvals ? pending.length : null,
        openIncidents: incidents ? open.length : null,
        upcomingMeetings: soon,
        attention: [...open, ...pending].slice(0, 5),
        activity,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function NexusWorkspace({ auth: _auth, sidebarOpen: _sidebarOpen, onAction, tasks = [], onToggleTask }: NexusWorkspaceProps) {
  const overview = useOverview();
  const anyUnavailable =
    overview.openDeals === null ||
    overview.pendingApprovals === null ||
    overview.openIncidents === null;

  const health = useMemo(() => {
    if (overview.status === "loading") {
      return { label: "Cargando estado…", className: "bg-white/5 border-white/10 text-zinc-400", dot: "bg-zinc-500" };
    }
    if (anyUnavailable) {
      return { label: "Estado no disponible", className: "bg-zinc-500/10 border-zinc-500/20 text-zinc-300", dot: "bg-zinc-400" };
    }
    if ((overview.openIncidents ?? 0) > 0) {
      return {
        label: `${overview.openIncidents} incidente${overview.openIncidents === 1 ? "" : "s"} abierto${overview.openIncidents === 1 ? "" : "s"}`,
        className: "bg-rose-500/10 border-rose-500/20 text-rose-300",
        dot: "bg-rose-400",
      };
    }
    if ((overview.pendingApprovals ?? 0) > 0) {
      return {
        label: `${overview.pendingApprovals} aprobación${overview.pendingApprovals === 1 ? "" : "es"} pendiente${overview.pendingApprovals === 1 ? "" : "s"}`,
        className: "bg-amber-500/10 border-amber-500/20 text-amber-300",
        dot: "bg-amber-400",
      };
    }
    return { label: "Sin pendientes críticos", className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", dot: "bg-emerald-400" };
  }, [overview.status, anyUnavailable, overview.openIncidents, overview.pendingApprovals]);

  return (
    <main className="flex-1 relative z-10 transition-all duration-500 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
            <p className="text-zinc-400 text-sm mt-1">
              General overview of your operations and pending actions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${health.className}`}>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${health.dot}`} />
              <span className="text-xs font-medium uppercase tracking-wider">{health.label}</span>
            </div>
          </div>
        </div>

        {/* Top Grid: Attention & Hermes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* A. Attention */}
          <div className="lg:col-span-2 bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Attention Required</h2>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 text-xs font-mono">
                {overview.status === "loading"
                  ? "…"
                  : overview.attention.length > 0
                    ? `${overview.attention.length} ${overview.attention.length === 1 ? "item" : "items"}`
                    : "Sin pendientes"}
              </span>
            </div>
            <div className="p-2 flex-1 flex flex-col space-y-1">
              {overview.status === "loading" && (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">Cargando pendientes…</div>
              )}
              {overview.status === "ready" && overview.attention.length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                  No hay aprobaciones ni incidentes abiertos.
                </div>
              )}
              {overview.attention.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onAction?.(item.action)}
                  className="w-full text-left flex items-start gap-4 p-3 hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer group"
                >
                  <div className={`p-2.5 rounded-lg shrink-0 group-hover:scale-105 transition-transform ${
                    item.type === "Incidente" ? "bg-rose-400/10 text-rose-400" : "bg-amber-400/10 text-amber-400"
                  }`}>
                    {item.type === "Incidente" ? <AlertOctagon className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {relativeTime(item.at)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{item.desc}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-medium">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-amber-400 flex items-center gap-0.5 transition-colors">
                        Revisar <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* E. Hermes Panel */}
          <div className="bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            <div className="p-5 border-b border-white/[0.08] flex items-center gap-2 relative z-10">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Hermes Insights</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <BrainCircuit className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {overview.status === "loading"
                  ? "Leyendo el estado de la operación…"
                  : anyUnavailable
                    ? "No hay lectura completa de la operación. Abre Hermes para revisar el estado real."
                    : overview.attention.length > 0
                      ? `Hay ${overview.attention.length} ${overview.attention.length === 1 ? "pendiente" : "pendientes"} de tu atención: ${overview.pendingApprovals ?? 0} aprobaciones y ${overview.openIncidents ?? 0} incidentes abiertos.`
                      : "No hay aprobaciones ni incidentes abiertos en este momento."}
              </p>
              <button 
                onClick={() => onAction && onAction('hermes')}
                className="mt-6 flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                <TerminalSquare className="w-4 h-4" />
                Open Hermes Terminal
              </button>
            </div>
          </div>
        </div>

        {/* Middle Grid: Operations Pulse & My Work */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* C. Operations Pulse */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            {[
              {
                label: "Deals abiertos",
                value: overview.openDeals,
                icon: Handshake,
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                action: "DATAROOM",
              },
              {
                label: "Aprobaciones",
                value: overview.pendingApprovals,
                icon: ShieldAlert,
                color: "text-amber-400",
                bg: "bg-amber-400/10",
                action: "APPROVALS",
              },
              {
                label: "Incidentes abiertos",
                value: overview.openIncidents,
                icon: AlertOctagon,
                color: "text-red-400",
                bg: "bg-red-400/10",
                action: "ACTIVITY",
              },
              {
                label: "Sesiones · 7 días",
                value: overview.upcomingMeetings,
                icon: Clock,
                color: "text-blue-400",
                bg: "bg-blue-400/10",
                action: "AGENDA",
              },
            ].map((stat, i) => (
              <button 
                key={i} 
                type="button"
                onClick={() => onAction?.(stat.action)}
                className="w-full text-left bg-[#0A0A0E] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer group"
              >
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <div
                    className="text-2xl font-bold text-white font-mono group-hover:text-amber-300 transition-colors"
                    title={stat.value === null ? "Fuente no disponible" : undefined}
                  >
                    {overview.status === "loading" ? "…" : stat.value === null ? "—" : stat.value}
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1 flex items-center justify-between">
                    <span>{stat.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* B. My Work */}
          <div className="lg:col-span-2 bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">My Work</h2>
              </div>
              <button 
                onClick={() => onAction?.('WORK_ENGINE')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                Ver Todas <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-2 flex-1 space-y-1">
              {tasks.filter(t => !t.completed).slice(0, 4).map((task) => (
                <div 
                  key={task.id} 
                  className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] rounded-xl transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask?.(task.id)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div
                      className="w-5 h-5 rounded border border-white/20 group-hover:border-emerald-500/80 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                      title="Marcar como completada"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-transparent group-hover:text-emerald-500/80 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors block truncate">
                        {task.title}
                      </span>
                      {task.assignee && (
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          Asignado: {task.assignee}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${task.priority === 'HIGH' ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {task.priority}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAction?.('WORK_ENGINE')}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                      title="Abrir detalles de la tarea"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => !t.completed).length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                  {tasks.length === 0
                    ? "Sin tareas registradas."
                    : "✓ Todas las tareas operativas están completadas"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* D. Recent Activity */}
        <div className="bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Activity</h2>
            </div>
            <button 
              onClick={() => onAction?.('ACTIVITY')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              Ver Registro <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {overview.status === "loading" && (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">Cargando actividad…</div>
              )}
              {overview.status === "ready" && overview.activity.length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                  Sin actividad registrada en aprobaciones o incidentes.
                </div>
              )}
              {overview.activity.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => onAction?.(log.action)}
                  className="w-full text-left flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <div className="mt-1 relative flex items-center justify-center w-6 h-6 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 group-hover:border-blue-400/50 transition-colors" />
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${log.type === "Incidente" ? "bg-rose-400" : "bg-amber-400"}`} />
                  </div>
                  <div className="flex-1 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <p className="text-sm text-zinc-300">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-2">{log.type}</span>
                      <span className="font-semibold text-white group-hover:text-blue-300 transition-colors">{log.title}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="text-xs text-zinc-500">{relativeTime(log.at) || "sin fecha"}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
