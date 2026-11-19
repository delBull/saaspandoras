"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Loader2, RefreshCw, Video, AlertTriangle } from "lucide-react";
import { getNexusClientHeaders } from "@/lib/nexus/client-auth-headers";
import { findPresentation } from "@/lib/nexus/presentations-catalog";
import { MeetingShareButton } from "@/components/meet/MeetingShareButton";

interface AgendaMeeting {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  presentationId: string | null;
  title: string | null;
  hasDealRoom: boolean;
  role: "host" | "participant";
  joinPath: string;
  attendance?: { attended: number; total: number };
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  ended: "border-white/10 bg-white/5 text-zinc-400",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  starting: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

/**
 * Mis reuniones (host o participante) dentro de Operations Hub.
 * Consume `GET /api/nexus/agenda`, que resuelve la identidad server-side.
 */
export function OperationsAgendaTab() {
  const [meetings, setMeetings] = useState<AgendaMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nexus/agenda", {
        headers: getNexusClientHeaders(),
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { code?: string; error?: string }));
        setError(
          data.code === "ORG_UNRESOLVED"
            ? "Tu identidad no tiene una organización asignada. Pide a un administrador que vincule tu colaborador a un tenant."
            : res.status === 401
              ? "Sesión de Nexus no válida."
              : data.error ?? "No se pudieron cargar tus reuniones."
        );
        setMeetings([]);
        return;
      }
      const data = await res.json();
      setMeetings(Array.isArray(data.meetings) ? data.meetings : []);
    } catch {
      setError("Error de red al cargar tus reuniones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Tres bloques: en vivo arriba (Meet Inmediata), programadas en espera y
  // anteriores atenuadas. La lista plana ordenada por fecha escondía la reunión
  // que se acababa de crear.
  const live = meetings
    .filter((m) => m.status === "live")
    .sort((a, b) => (b.startsAt ? new Date(b.startsAt).getTime() : 0) - (a.startsAt ? new Date(a.startsAt).getTime() : 0));
  const scheduled = meetings
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => (a.startsAt ? new Date(a.startsAt).getTime() : 0) - (b.startsAt ? new Date(b.startsAt).getTime() : 0));
  const past = meetings
    .filter((m) => m.status !== "live" && m.status !== "scheduled")
    .sort((a, b) => (b.startsAt ? new Date(b.startsAt).getTime() : 0) - (a.startsAt ? new Date(a.startsAt).getTime() : 0));

  return (
    <div className="p-5 overflow-y-auto flex-1 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-lime-500/20 bg-lime-500/[0.04]">
        <div>
          <p className="text-[11px] text-lime-300 font-mono uppercase font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>MIS REUNIONES</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Solo aparecen las sesiones donde eres host o participante.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-400 text-xs font-mono">
            {loading ? "Cargando…" : `${meetings.length} sesión${meetings.length === 1 ? "" : "es"}`}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-mono flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && meetings.length === 0 && (
        <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono p-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando agenda…
        </div>
      )}

      {!loading && meetings.length === 0 && !error && (
        <div className="border border-white/5 border-dashed rounded-xl p-8 text-center bg-black/20">
          <Video className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-300">No tienes reuniones próximas</p>
          <p className="text-xs text-zinc-500 mt-1">
            Agenda desde Clients & CRM (deal) o desde la Agenda Soberana.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {[
          { label: "Ahora", rows: live, tone: "live" as const },
          { label: "Programadas", rows: scheduled, tone: "waiting" as const },
          { label: "Anteriores", rows: past, tone: "past" as const },
        ]
          .filter((section) => section.rows.length > 0)
          .map((section) => (
            <section key={section.label} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    section.tone === "live"
                      ? "bg-lime-400 animate-pulse"
                      : section.tone === "waiting"
                        ? "bg-amber-400/70"
                        : "bg-zinc-600"
                  }`}
                />
                <h3
                  className={`text-[10px] font-mono uppercase tracking-[0.25em] ${
                    section.tone === "live" ? "text-lime-300" : section.tone === "waiting" ? "text-amber-300/80" : "text-zinc-500"
                  }`}
                >
                  {section.label}
                </h3>
                <span className="text-[10px] font-mono text-zinc-600">{section.rows.length}</span>
              </div>

              {section.rows.map((meeting) => {
                const deck = findPresentation(meeting.presentationId);
                const start = meeting.startsAt ? new Date(meeting.startsAt) : null;
                const end = meeting.endsAt ? new Date(meeting.endsAt) : null;
                const canJoin = meeting.status !== "cancelled" && meeting.status !== "ended";
                const isLive = meeting.status === "live";
                const isWaiting = meeting.status === "scheduled" && start
                  ? (start.getTime() - Date.now()) / 60000 > 15
                  : false;

                return (
                  <div
                    key={meeting.id}
                    className={`p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 ${
                      isLive
                        ? "border border-lime-500/30 bg-lime-500/[0.045]"
                        : "border border-white/5 bg-[#0C0C10]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${STATUS_STYLE[meeting.status] ?? "border-white/10 text-zinc-400"}`}>
                          {isWaiting ? "en espera" : meeting.status}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {meeting.role === "host" ? "Host" : "Participante"}
                        </span>
                        {deck && (
                          <span className="text-[10px] font-mono text-purple-300 truncate max-w-[12rem] sm:max-w-[16rem]">{deck.title}</span>
                        )}
                        {meeting.attendance && meeting.attendance.total > 0 && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {meeting.status === "ended"
                              ? `Asistencia ${meeting.attendance.attended}/${meeting.attendance.total}`
                              : `${meeting.attendance.total} invitado${meeting.attendance.total === 1 ? "" : "s"}`}
                          </span>
                        )}
                      </div>
                      {meeting.title && (
                        <p className="text-sm text-zinc-100 truncate mb-0.5">{meeting.title}</p>
                      )}
                      <p className="text-xs text-zinc-200">
                        {start
                          ? `${start.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}${end ? ` → ${end.toLocaleTimeString("es-MX", { timeStyle: "short" })}` : ""}`
                          : "Sin fecha"}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-600 truncate">{meeting.id}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(isLive || meeting.status === "scheduled") && (
                        <MeetingShareButton
                          meetingId={meeting.id}
                          title={meeting.title ?? deck?.title ?? "Pandora's · Sovereign Meet"}
                          startsAt={start}
                          endsAt={end}
                        />
                      )}
                      {canJoin ? (
                        <a
                          href={meeting.joinPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-1.5 border ${
                            isLive
                              ? "border-lime-500/40 bg-lime-500/15 hover:bg-lime-500/25 text-lime-200"
                              : "border-lime-500/30 bg-lime-500/10 hover:bg-lime-500/20 text-lime-200"
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          Entrar
                        </a>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-600">Cerrada</span>
                      )}
                      <a
                        href={`/nexus/agenda`}
                        className="px-2 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white text-[11px] font-mono"
                        title="Abrir agenda completa"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
      </div>
    </div>
  );
}
