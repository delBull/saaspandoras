import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { eq, or, and, inArray } from "@saasfly/db-core";
import { meetings, meetingParticipants, schedulingBookings, nexusCollaborators } from "@saasfly/db-core";
import jwt from "jsonwebtoken";
import Link from "next/link";
import { ArrowLeft, Calendar, Video } from "lucide-react";
import { CancelMeetingButton } from "./CancelMeetingButton";
import { LaunchImmediateMeetingButton } from "./LaunchImmediateMeetingButton";
import { CopyLinkButton } from "./CopyLinkButton";
import { AgendaListClient } from "./AgendaListClient";
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
      inArray(meetings.status, ["scheduled", "live", "ended"]),
      or(
        eq(meetings.hostCollaboratorId, Number(collaboratorId)),
        inArray(meetings.id, participantMeetingIds)
      )
    );
  } else {
    whereClause = and(
      eq(meetings.canonicalOrgId, orgId),
      inArray(meetings.status, ["scheduled", "live", "ended"]),
      eq(meetings.hostCollaboratorId, Number(collaboratorId))
    );
  }

  const agendaRows = await db
    .select({
      meeting: meetings,
      booking: schedulingBookings,
      host: nexusCollaborators,
    })
    .from(meetings)
    .leftJoin(schedulingBookings, eq(meetings.appointmentId, schedulingBookings.id))
    .leftJoin(nexusCollaborators, eq(meetings.hostCollaboratorId, nexusCollaborators.id))
    .where(whereClause)
    .orderBy(meetings.startsAt);

  const now = new Date();

  // Pre-calculate join URLs
  const joinUrls: Record<string, string | null> = {};
  agendaRows.forEach(row => {
    const startsAt = row.meeting.startsAt ? new Date(row.meeting.startsAt) : now;
    const minutesUntilStart = (startsAt.getTime() - now.getTime()) / 60000;
    const canJoin = row.meeting.status === "live" || (row.meeting.status === "scheduled" && minutesUntilStart <= 15 && minutesUntilStart > -60);
    
    if (canJoin && MEET_JOIN_SECRET) {
      const joinRef = jwt.sign(
        { meetingId: row.meeting.id, collaboratorId: collaboratorId.toString(), orgId },
        MEET_JOIN_SECRET,
        { algorithm: "HS256", expiresIn: "15m" }
      );
      joinUrls[row.meeting.id] = `/meet?ref=${joinRef}`;
    } else {
      joinUrls[row.meeting.id] = null;
    }
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-lime-500/30 overflow-x-hidden pb-32">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link
              href={token ? `/nexus?token=${token}` : "/nexus"}
              className="inline-flex items-center text-zinc-500 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-mono">Volver al Command Center</span>
            </Link>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">Agenda Soberana</h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
              Reuniones, AI Ingestion y Action Items
            </p>
          </div>
          <div>
            <LaunchImmediateMeetingButton />
          </div>
        </header>

        {agendaRows.length === 0 ? (
          <div className="border border-zinc-900 rounded-xl p-12 text-center bg-zinc-950/50">
            <Calendar size={32} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Sin Eventos Próximos</p>
          </div>
        ) : (
          <AgendaListClient 
            agendaRows={agendaRows} 
            collaboratorId={collaboratorId.toString()} 
            now={now} 
            joinUrls={joinUrls} 
          />
        )}
      </div>
    </div>
  );
}
