"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Video, FileText } from "lucide-react";
import { CopyLinkButton } from "./CopyLinkButton";
import { CancelMeetingButton } from "./CancelMeetingButton";
import { MeetingDetailsDrawer } from "./MeetingDetailsDrawer";

interface AgendaListClientProps {
  agendaRows: any[];
  collaboratorId: string | number;
  now: Date;
  joinUrls: Record<string, string | null>;
}

export function AgendaListClient({ agendaRows, collaboratorId, now, joinUrls }: AgendaListClientProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);

  return (
    <div className="space-y-4">
      {agendaRows.map((row) => {
        const isHost = row.meeting.hostCollaboratorId?.toString() === collaboratorId.toString();
        const startsAt = row.meeting.startsAt ? new Date(row.meeting.startsAt) : now;
        const endsAt = row.meeting.endsAt ? new Date(row.meeting.endsAt) : new Date(startsAt.getTime() + 30 * 60000);
        
        const minutesUntilStart = (startsAt.getTime() - now.getTime()) / 60000;
        const canJoin = row.meeting.status === "live" || (row.meeting.status === "scheduled" && minutesUntilStart <= 15 && minutesUntilStart > -60);
        const canCancel = isHost && row.meeting.status === "scheduled";
        const title = row.booking ? `Reunión con ${row.booking.leadName}` : "Sovereign Meet";
        const joinUrl = joinUrls[row.meeting.id];

        const isCompletedOrArchived = row.meeting.status === "ended" || row.meeting.status === "archived";

        return (
          <div key={row.meeting.id} className="relative group overflow-hidden border border-zinc-900 bg-zinc-950/50 rounded-xl p-6 hover:border-zinc-800 transition-all duration-300">
            {row.meeting.status === "live" && (
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50 animate-pulse" />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest ${
                    row.meeting.status === "live" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                    row.meeting.status === "ended" ? "bg-lime-500/10 text-lime-500 border border-lime-500/20" :
                    "bg-zinc-900 text-zinc-400 border border-zinc-800"
                  }`}>
                    {row.meeting.status}
                  </div>
                  {isHost && (
                    <div className="px-2 py-0.5 rounded bg-lime-500/10 text-lime-500 border border-lime-500/20 text-[9px] font-mono uppercase tracking-widest">
                      Host
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-light text-zinc-100">{title}</h3>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span>Host: {row.host?.name ?? "Admin"}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="text-right flex items-center md:flex-col gap-2 md:gap-0 mr-4">
                  <p className="text-sm font-mono text-zinc-300">
                    {startsAt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <p className="text-xs font-mono text-zinc-500">
                    {startsAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} - {endsAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {row.meeting.status === "live" && (
                    <CopyLinkButton meetingId={row.meeting.id} />
                  )}
                  {canJoin && (
                    <Link
                      href={joinUrl || "#"}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors"
                    >
                      <Video size={14} />
                      {isHost ? "Iniciar" : "Unirse"}
                    </Link>
                  )}
                  {canCancel && (
                    <CancelMeetingButton meetingId={row.meeting.id} />
                  )}
                  {/* Button to open Sovereign Agenda drawer */}
                  <button
                    onClick={() => setSelectedMeeting({
                      id: row.meeting.id,
                      title,
                      date: startsAt,
                      hostName: row.host?.name ?? "Admin",
                      status: row.meeting.status
                    })}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors"
                  >
                    <FileText size={14} />
                    Agenda
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <MeetingDetailsDrawer 
        isOpen={!!selectedMeeting} 
        onClose={() => setSelectedMeeting(null)} 
        meeting={selectedMeeting} 
      />
    </div>
  );
}
