"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Video, FileText, Radio, KeyRound, Check } from "lucide-react";
import { MeetingShareButton } from "@/components/meet/MeetingShareButton";
import { AddToGoogleCalendarButton } from "@/components/meet/AddToGoogleCalendarButton";
import { shortMeetingPath } from "@/lib/meet/meeting-links";
import { CancelMeetingButton } from "./CancelMeetingButton";
import { ArchiveMeetingButton } from "./ArchiveMeetingButton";
import { MeetingDetailsDrawer } from "./MeetingDetailsDrawer";

interface AgendaListClientProps {
  agendaRows: any[];
  collaboratorId: string | number;
  now: Date;
  joinUrls: Record<string, string | null>;
}

const timeOf = (value: Date | string | null | undefined): number =>
  value ? new Date(value).getTime() : 0;

/**
 * Agenda en tres bloques, no en una lista plana:
 *   1. Ahora        → reuniones `live` (Meet Inmediata). Van arriba, con pulso.
 *   2. Programadas  → `scheduled` en orden ascendente; "En espera" si falta > 15 min.
 *   3. Anteriores   → `ended`, atenuadas y al final.
 *
 * Antes todo se ordenaba por `startsAt` ascendente: una Meet Inmediata recién
 * creada caía entre las de ayer y las de mañana, fuera de la vista.
 */
const AgendaSection = ({
  label,
  count,
  tone,
  children,
}: {
  label: string;
  count: number;
  tone: "live" | "waiting" | "past";
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2 px-1">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "live" ? "bg-lime-400 animate-pulse" : tone === "waiting" ? "bg-amber-400/70" : "bg-zinc-600"
        }`}
      />
      <h2
        className={`text-[10px] font-mono uppercase tracking-[0.25em] ${
          tone === "live" ? "text-lime-300" : tone === "waiting" ? "text-amber-300/80" : "text-zinc-500"
        }`}
      >
        {label}
      </h2>
      <span className="text-[10px] font-mono text-zinc-600">{count}</span>
    </div>
    {children}
  </section>
);

export function AgendaListClient({ agendaRows, collaboratorId, now, joinUrls }: AgendaListClientProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [copiedHostId, setCopiedHostId] = useState<string | null>(null);

  const live = agendaRows
    .filter((row) => row.meeting.status === "live")
    .sort((a, b) => timeOf(b.meeting.startsAt) - timeOf(a.meeting.startsAt));
  const scheduled = agendaRows
    .filter((row) => row.meeting.status === "scheduled")
    .sort((a, b) => timeOf(a.meeting.startsAt) - timeOf(b.meeting.startsAt));
  const past = agendaRows
    .filter((row) => row.meeting.status !== "live" && row.meeting.status !== "scheduled")
    .sort((a, b) => timeOf(b.meeting.startsAt) - timeOf(a.meeting.startsAt));

  const renderRow = (row: any) => {
    const isHost = row.meeting.hostCollaboratorId?.toString() === collaboratorId.toString();
    const startsAt = row.meeting.startsAt ? new Date(row.meeting.startsAt) : now;
    const endsAt = row.meeting.endsAt ? new Date(row.meeting.endsAt) : new Date(startsAt.getTime() + 30 * 60000);

    const minutesUntilStart = (startsAt.getTime() - now.getTime()) / 60000;
    const canJoin = row.meeting.status === "live" || (row.meeting.status === "scheduled" && minutesUntilStart <= 15 && minutesUntilStart > -60);
    const canCancel = isHost && row.meeting.status === "scheduled";
    const canArchive = isHost && row.meeting.status === "ended";
    // Asunto propio (reunión externa) > cita de agenda > genérico.
    const title =
      (typeof row.meeting.title === "string" && row.meeting.title.trim()) ||
      (row.booking ? `Reunión con ${row.booking.leadName}` : "Sovereign Meet");
    const joinUrl = joinUrls[row.meeting.id];

    const isLive = row.meeting.status === "live";
    const isScheduled = row.meeting.status === "scheduled";
    const isWaiting = isScheduled && minutesUntilStart > 15;
    const isPast = !isLive && !isScheduled;

    return (
      <div
        key={row.meeting.id}
        id={`meeting-${row.meeting.id}`}
        className={`relative group overflow-hidden rounded-xl p-5 sm:p-6 transition-all duration-300 scroll-mt-24 ${
          isLive
            ? "border border-lime-500/35 bg-lime-500/[0.045] shadow-[0_0_25px_rgba(132,204,22,0.08)]"
            : isPast
              ? "border border-zinc-900 bg-zinc-950/30 opacity-70"
              : "border border-zinc-900 bg-zinc-950/50 hover:border-zinc-800"
        }`}
      >
        {isLive && <div className="absolute top-0 left-0 w-1 h-full bg-lime-400/70 animate-pulse" />}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {isLive ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-lime-500/15 text-lime-300 border border-lime-500/30 text-[9px] font-mono uppercase tracking-widest">
                  <Radio className="w-3 h-3 animate-pulse" />
                  En vivo
                </div>
              ) : isScheduled ? (
                <div
                  className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest border ${
                    isWaiting
                      ? "bg-amber-500/[0.07] text-amber-300/90 border-amber-500/20"
                      : "bg-sky-500/10 text-sky-300 border-sky-500/25"
                  }`}
                >
                  {isWaiting ? "En espera" : "Por iniciar"}
                </div>
              ) : (
                <div className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 text-[9px] font-mono uppercase tracking-widest">
                  {row.meeting.status}
                </div>
              )}

              {isHost && (
                <div className="px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/20 text-[9px] font-mono uppercase tracking-widest">
                  Host
                </div>
              )}

              {isWaiting && (
                <span className="text-[10px] font-mono text-zinc-500">
                  {startsAt.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              )}
            </div>

            <h3 className={`text-lg sm:text-xl font-light truncate ${isPast ? "text-zinc-500" : "text-zinc-100"}`}>
              {title}
            </h3>
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest truncate">
              Host: {row.host?.name ?? "Admin"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="sm:text-right flex items-center sm:flex-col gap-2 sm:gap-0 sm:mr-2">
              <p className={`text-sm font-mono ${isPast ? "text-zinc-600" : "text-zinc-300"}`}>
                {startsAt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <p className="text-xs font-mono text-zinc-500">
                {startsAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} -{" "}
                {endsAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(isLive || isScheduled) && (
                <>
                  <MeetingShareButton
                    meetingId={row.meeting.id}
                    title={title}
                    startsAt={startsAt}
                    endsAt={endsAt}
                  />
                  <AddToGoogleCalendarButton
                    title={title}
                    startsAt={startsAt}
                    endsAt={endsAt}
                    meetingPath={isHost ? shortMeetingPath(row.meeting.id) : joinUrl ?? shortMeetingPath(row.meeting.id)}
                    hostName={row.host?.name ?? "Admin"}
                  />
                </>
              )}
              {isHost && joinUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}${joinUrl}`);
                      setCopiedHostId(row.meeting.id);
                      setTimeout(() => setCopiedHostId(null), 2000);
                    } catch {
                      /* el portapapeles requiere contexto seguro */
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-[10px] font-mono uppercase tracking-wider transition-colors"
                  title="Copiar enlace de anfitrión. Válido 15 min; quien lo tenga entra con controles de host."
                  aria-label="Copiar enlace de anfitrión"
                >
                  {copiedHostId === row.meeting.id ? <Check size={14} /> : <KeyRound size={14} />}
                  <span className="hidden sm:inline">
                    {copiedHostId === row.meeting.id ? "Copiado" : "Host"}
                  </span>
                </button>
              )}
              {canJoin && (
                <Link
                  href={joinUrl || "#"}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors ${
                    isLive
                      ? "bg-lime-500 text-black hover:bg-lime-400 font-bold"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  <Video size={14} />
                  {isHost ? "Iniciar" : "Unirse"}
                </Link>
              )}
              {canCancel && <CancelMeetingButton meetingId={row.meeting.id} />}
              {canArchive && <ArchiveMeetingButton meetingId={row.meeting.id} />}
              <button
                onClick={() =>
                  setSelectedMeeting({
                    id: row.meeting.id,
                    title,
                    date: startsAt,
                    hostName: row.host?.name ?? "Admin",
                    status: row.meeting.status,
                    isHost,
                    joinPath: isHost ? shortMeetingPath(row.meeting.id) : joinUrl,
                    endsAt,
                  })
                }
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors"
              >
                <FileText size={14} />
                Agenda
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {live.length > 0 && (
        <AgendaSection label="Ahora" count={live.length} tone="live">
          <div className="space-y-3">{live.map(renderRow)}</div>
        </AgendaSection>
      )}

      {scheduled.length > 0 && (
        <AgendaSection label="Programadas" count={scheduled.length} tone="waiting">
          <div className="space-y-3">{scheduled.map(renderRow)}</div>
        </AgendaSection>
      )}

      {past.length > 0 && (
        <AgendaSection label="Anteriores" count={past.length} tone="past">
          <div className="space-y-3">{past.map(renderRow)}</div>
        </AgendaSection>
      )}

      <MeetingDetailsDrawer
        isOpen={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting}
      />
    </div>
  );
}
