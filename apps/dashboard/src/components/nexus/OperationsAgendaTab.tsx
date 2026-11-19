"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Loader2, RefreshCw, Video, AlertTriangle } from "lucide-react";
import { getNexusClientHeaders } from "@/lib/nexus/client-auth-headers";
import { findPresentation } from "@/lib/nexus/presentations-catalog";

interface AgendaMeeting {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  presentationId: string | null;
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
        setError(res.status === 401 ? "Sesión de Nexus no válida." : "No se pudieron cargar tus reuniones.");
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

      <div className="space-y-2">
        {meetings.map((meeting) => {
          const deck = findPresentation(meeting.presentationId);
          const start = meeting.startsAt ? new Date(meeting.startsAt) : null;
          const end = meeting.endsAt ? new Date(meeting.endsAt) : null;
          const canJoin = meeting.status !== "cancelled" && meeting.status !== "ended";

          return (
            <div
              key={meeting.id}
              className="p-3 sm:p-4 rounded-xl border border-white/5 bg-[#0C0C10] flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${STATUS_STYLE[meeting.status] ?? "border-white/10 text-zinc-400"}`}>
                    {meeting.status}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {meeting.role === "host" ? "Host" : "Participante"}
                  </span>
                  {deck && (
                    <span className="text-[10px] font-mono text-purple-300 truncate max-w-[16rem]">{deck.title}</span>
                  )}
                  {meeting.attendance && meeting.attendance.total > 0 && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      {meeting.status === "ended"
                        ? `Asistencia ${meeting.attendance.attended}/${meeting.attendance.total}`
                        : `${meeting.attendance.total} invitado${meeting.attendance.total === 1 ? "" : "s"}`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-200">
                  {start
                    ? `${start.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}${end ? ` → ${end.toLocaleTimeString("es-MX", { timeStyle: "short" })}` : ""}`
                    : "Sin fecha"}
                </p>
                <p className="text-[10px] font-mono text-zinc-600 truncate">{meeting.id}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canJoin ? (
                  <a
                    href={meeting.joinPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-lime-500/30 bg-lime-500/10 hover:bg-lime-500/20 text-lime-200 text-[11px] font-mono flex items-center gap-1.5"
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
      </div>
    </div>
  );
}
