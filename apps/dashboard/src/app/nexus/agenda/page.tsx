import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { db } from "@/db";
import { eq, or, and, inArray } from "drizzle-orm";
import { meetings, meetingParticipants, schedulingBookings, users } from "@/db/schema";
import jwt from "jsonwebtoken";
import Link from "next/link";
import { ArrowLeft, Calendar, Video } from "lucide-react";
import { CancelMeetingButton } from "./CancelMeetingButton";

export const dynamic = "force-dynamic";

export default async function NexusAgendaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const MEET_JOIN_SECRET = process.env.MEET_JOIN_SECRET;
  const { token } = await searchParams;
  const authCtx = await getNexusAuthContext(null, token);

  if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500 tracking-widest uppercase">No Autorizado</p>
      </div>
    );
  }

  const { canonicalOrgId, collaboratorId } = authCtx;
  const orgId = canonicalOrgId ?? "pandoras";

  // Find meetings where user is participant
  const participantRows = await db
    .select({ meetingId: meetingParticipants.meetingId })
    .from(meetingParticipants)
    .where(eq(meetingParticipants.identityId, collaboratorId.toString()));

  const participantMeetingIds = participantRows.map((r) => r.meetingId);

  let whereClause;
  if (participantMeetingIds.length > 0) {
    whereClause = and(
      eq(meetings.canonicalOrgId, orgId),
      inArray(meetings.status, ["scheduled", "live"]),
      or(
        eq(meetings.hostCollaboratorId, collaboratorId.toString()),
        inArray(meetings.id, participantMeetingIds)
      )
    );
  } else {
    whereClause = and(
      eq(meetings.canonicalOrgId, orgId),
      inArray(meetings.status, ["scheduled", "live"]),
      eq(meetings.hostCollaboratorId, collaboratorId.toString())
    );
  }

  const agendaRows = await db
    .select({
      meeting: meetings,
      booking: schedulingBookings,
      host: users,
    })
    .from(meetings)
    .leftJoin(schedulingBookings, eq(meetings.appointmentId, schedulingBookings.id))
    .leftJoin(users, eq(meetings.hostCollaboratorId, users.id))
    .where(whereClause)
    .orderBy(meetings.startsAt);

  const now = new Date();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-lime-500/30 overflow-x-hidden pb-32">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <header className="flex items-center justify-between mb-12">
          <div>
            <Link
              href={token ? `/nexus?token=${token}` : "/nexus"}
              className="inline-flex items-center text-zinc-500 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-mono">Volver al Command Center</span>
            </Link>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">Agenda</h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
              Reuniones Activas y Programadas
            </p>
          </div>
        </header>

        {agendaRows.length === 0 ? (
          <div className="border border-zinc-900 rounded-xl p-12 text-center bg-zinc-950/50">
            <Calendar size={32} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Sin Eventos Próximos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendaRows.map((row) => {
              const isHost = row.meeting.hostCollaboratorId === collaboratorId.toString();
              const startsAt = row.meeting.startsAt ? new Date(row.meeting.startsAt) : now;
              const endsAt = row.meeting.endsAt ? new Date(row.meeting.endsAt) : new Date(startsAt.getTime() + 30 * 60000);
              
              const minutesUntilStart = (startsAt.getTime() - now.getTime()) / 60000;
              const canJoin = row.meeting.status === "live" || (row.meeting.status === "scheduled" && minutesUntilStart <= 15 && minutesUntilStart > -60);
              const canCancel = isHost && row.meeting.status === "scheduled";
              const title = row.booking ? `Reunión con ${row.booking.leadName}` : "Sovereign Meet";

              let joinUrl: string | null = null;
              if (canJoin && MEET_JOIN_SECRET) {
                const joinRef = jwt.sign(
                  { meetingId: row.meeting.id, collaboratorId: collaboratorId.toString(), orgId },
                  MEET_JOIN_SECRET,
                  { algorithm: "HS256", expiresIn: "15m" }
                );
                joinUrl = `/meet?ref=${joinRef}`;
              }

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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
