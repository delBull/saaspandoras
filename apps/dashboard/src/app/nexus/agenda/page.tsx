import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { eq, or, and, inArray, isNull, sql } from "@saasfly/db-core";
import { meetings, meetingParticipants, schedulingBookings, nexusCollaborators } from "@saasfly/db-core";
import jwt from "jsonwebtoken";
import Link from "next/link";
import { ArrowLeft, Calendar, Video } from "lucide-react";
import { CancelMeetingButton } from "./CancelMeetingButton";
import { LaunchImmediateMeetingButton } from "./LaunchImmediateMeetingButton";
import { SchedulePresentationForm } from "./SchedulePresentationForm";
import { AgendaListClient } from "./AgendaListClient";
import { shortMeetingPath } from "@/lib/meet/meeting-links";
export const dynamic = "force-dynamic";

export default async function NexusAgendaPage({ searchParams }: { searchParams: Promise<{ token?: string; deck?: string; schedule?: string }> }) {
  const MEET_JOIN_SECRET = process.env.MEET_JOIN_SECRET;
  const { token, deck, schedule } = await searchParams;
  const authCtx = await getNexusAuthContext(null, token);

  if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500 tracking-widest uppercase">No Autorizado</p>
      </div>
    );
  }

  const { collaboratorId } = authCtx;

  // Fuente de verdad del tenant: `nexusCollaborators.canonicalOrgId`. Si el
  // contexto no la trae (p. ej. magic link sin proyectos asignados), se resuelve
  // aquí; si tampoco existe, se falla cerrado.
  let canonicalOrgId = authCtx.canonicalOrgId;
  if (!canonicalOrgId) {
    const [collabOrg] = await db
      .select({ canonicalOrgId: nexusCollaborators.canonicalOrgId })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.id, collaboratorId))
      .limit(1);
    canonicalOrgId = collabOrg?.canonicalOrgId ?? null;
  }

  // 🛡️ Fail-closed: sin organización canónica NO se cae a "pandoras". Ese fallback
  // mostraba la agenda de la casa a colaboradores de otros tenants cuando su
  // resolución de tenant era ambigua o inexistente.
  if (!canonicalOrgId) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-300">Agenda no disponible</p>
          <h1 className="text-xl font-semibold">Tu organización no está resuelta</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Tu identidad es válida, pero no tiene un tenant canónico asignado. Pide a un
            administrador que vincule tu colaborador a una organización para ver tu agenda.
          </p>
        </div>
      </main>
    );
  }
  const orgId = canonicalOrgId;

  // Reuniones donde soy participante. `identity_id` guarda el email o el id con el
  // que se invitó (así lo escribe AgendaCore), por eso se compara también por email.
  const email = authCtx.email?.toLowerCase().trim() || null;
  const participantRows = await db
    .select({
      meetingId: meetingParticipants.meetingId,
      joinToken: meetingParticipants.joinToken,
    })
    .from(meetingParticipants)
    .where(
      email
        ? or(
            eq(meetingParticipants.identityId, collaboratorId.toString()),
            sql`lower(${meetingParticipants.identityId}) = ${email}`
          )
        : eq(meetingParticipants.identityId, collaboratorId.toString())
    );

  const participantMeetingIds = Array.from(new Set(participantRows.map((r) => r.meetingId)));
  const participantTokenByMeeting = new Map(
    participantRows.map((row) => [row.meetingId, row.joinToken] as const)
  );

  let whereClause;
  if (participantMeetingIds.length > 0) {
    whereClause = and(
      eq(meetings.canonicalOrgId, orgId),
      isNull(meetings.archivedAt),
      inArray(meetings.status, ["scheduled", "live", "ended"]),
      or(
        eq(meetings.hostCollaboratorId, Number(collaboratorId)),
        inArray(meetings.id, participantMeetingIds)
      )
    );
  } else {
    whereClause = and(
      eq(meetings.canonicalOrgId, orgId),
      isNull(meetings.archivedAt),
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
    
    if (!canJoin) {
      joinUrls[row.meeting.id] = null;
      return;
    }

    const isHost = String(row.meeting.hostCollaboratorId) === String(collaboratorId);
    if (isHost && MEET_JOIN_SECRET) {
      // El host entra con una referencia firmada: el servidor lo reconoce por id,
      // nunca por nombre ni email.
      const joinRef = jwt.sign(
        { meetingId: row.meeting.id, collaboratorId: collaboratorId.toString(), orgId },
        MEET_JOIN_SECRET,
        { algorithm: "HS256", expiresIn: "15m" }
      );
      joinUrls[row.meeting.id] = `/meet?ref=${joinRef}`;
      return;
    }

    // Participante: se usa SU token personal (?p=), que es lo que registra
    // asistencia. Antes se firmaba un ref genérico y la asistencia se perdía.
    joinUrls[row.meeting.id] = shortMeetingPath(
      row.meeting.id,
      participantTokenByMeeting.get(row.meeting.id) ?? null
    );
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
            <p className="text-zinc-600 text-[10px] font-mono mt-2 max-w-xl leading-relaxed">
              El anfitrión se reconoce por tu sesión de Nexus, no por el dispositivo. En otro
              equipo, inicia sesión aquí. En los 15 min previos también puedes copiar el
              enlace de anfitrión (quien lo tenga entra con tus controles).
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <SchedulePresentationForm initialDeck={deck ?? null} initialOpen={schedule === "1"} />
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
