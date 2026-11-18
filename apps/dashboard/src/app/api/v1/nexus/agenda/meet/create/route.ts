import { NextRequest, NextResponse } from 'next/server';
import { checkNexusPermission, getNexusAuthContext } from '@saasfly/shared';
import { AgendaCore } from '@saasfly/agenda-sdk';
import { isKnownPresentation } from '@/lib/nexus/presentations-catalog';
import { defaultAppBaseUrl, sendMeetingInvites } from '@/lib/nexus/meeting-invites';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🏛️ ARCHITECTURE NOTE: Sovereign Agenda Core (v1.0 Decoupling)
 * =============================================================
 * Camino 2 de agenda: reunión suelta desde la Agenda Soberana (sin Deal Room).
 * El camino 1 es `POST /api/nexus/deals/:id/schedule` (hereda el deck del deal).
 *
 * Este endpoint era un ORPHAN (sin caller). Ahora lo consume el formulario de
 * /nexus/agenda. Endurecido para alinearse con el camino 1:
 *   - capability `calendar.manage` + host resuelto de la sesión (nunca del body)
 *   - presentationId validado contra el catálogo soberano
 *   - participantes como emails validados (máx. 20)
 *   - invitaciones por email con link personal que registra asistencia
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PARTICIPANTS = 20;
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 240;
const DEFAULT_DURATION_MINUTES = 30;
const PAST_TOLERANCE_MS = 5 * 60 * 1000;
const HORIZON_DAYS = 365;

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: NextRequest) {
  // 1. Identidad + capability (server-authoritative)
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated) {
    return fail(401, 'UNAUTHORIZED', 'Sesión de Nexus requerida.');
  }
  if (!checkNexusPermission(auth, 'calendar.manage')) {
    return fail(403, 'MISSING_CALENDAR_MANAGE', 'Tu identidad no tiene la capability calendar.manage.');
  }

  // 2. Payload
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, 'INVALID_BODY', 'El cuerpo de la petición no es JSON válido.');
  }

  const rawScheduledFor = body.scheduledFor ?? body.startsAt;
  const startsAt = new Date(String(rawScheduledFor ?? ''));
  if (!rawScheduledFor || Number.isNaN(startsAt.getTime())) {
    return fail(400, 'INVALID_SCHEDULED_FOR', 'scheduledFor debe ser una fecha ISO válida.');
  }

  const now = Date.now();
  if (startsAt.getTime() < now - PAST_TOLERANCE_MS) {
    return fail(400, 'SCHEDULED_FOR_IN_PAST', 'La fecha de inicio ya pasó.');
  }
  if (startsAt.getTime() > now + HORIZON_DAYS * 24 * 60 * 60 * 1000) {
    return fail(400, 'SCHEDULED_FOR_OUT_OF_HORIZON', `La fecha excede ${HORIZON_DAYS} días.`);
  }

  const durationMinutes = Number(body.durationMinutes ?? DEFAULT_DURATION_MINUTES);
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < MIN_DURATION_MINUTES ||
    durationMinutes > MAX_DURATION_MINUTES
  ) {
    return fail(
      400,
      'INVALID_DURATION',
      `durationMinutes debe ser un entero entre ${MIN_DURATION_MINUTES} y ${MAX_DURATION_MINUTES}.`
    );
  }

  let presentationId: string | null = null;
  if (body.presentationId !== undefined && body.presentationId !== null && body.presentationId !== '') {
    const candidate = String(body.presentationId).trim();
    if (!isKnownPresentation(candidate)) {
      return fail(400, 'INVALID_PRESENTATION_ID', 'presentationId no existe en el catálogo de presentaciones.');
    }
    presentationId = candidate;
  }

  const rawParticipants = Array.isArray(body.participants) ? body.participants : [];
  if (rawParticipants.length > MAX_PARTICIPANTS) {
    return fail(400, 'TOO_MANY_PARTICIPANTS', `Máximo ${MAX_PARTICIPANTS} participantes por reunión.`);
  }
  const emails = Array.from(
    new Set(
      rawParticipants
        .map((value) => String(value ?? '').trim().toLowerCase())
        .filter(Boolean)
    )
  );
  const invalid = emails.filter((email) => !EMAIL_PATTERN.test(email));
  if (invalid.length > 0) {
    return fail(400, 'INVALID_PARTICIPANT_EMAIL', `Emails inválidos: ${invalid.join(', ')}`);
  }

  // 3. Host y tenant desde la sesión
  const hostCollaboratorId = auth.collaboratorId ?? null;
  if (!hostCollaboratorId) {
    return fail(
      409,
      'HOST_COLLABORATOR_UNRESOLVED',
      'Tu sesión no está vinculada a un colaborador de Nexus; no se puede asignar host.'
    );
  }
  const canonicalOrgId = auth.canonicalOrgId || 'pandoras';

  // 4. Dominio canónico
  try {
    const meeting = await AgendaCore.createMeeting({
      canonicalOrgId,
      hostCollaboratorId,
      presentationId,
      scheduledFor: startsAt,
      durationMinutes,
      collaborators: emails,
    });

    const baseUrl = defaultAppBaseUrl();
    const joinTokenByEmail = new Map<string, string>(
      (meeting.participants ?? []).map((participant) => [
        participant.identityId.toLowerCase(),
        participant.joinToken,
      ])
    );

    const invites = await sendMeetingInvites({
      meetingId: meeting.id,
      startsAt,
      endsAt: meeting.endsAt,
      deckSlug: presentationId,
      recipients: emails.map((email) => ({
        email,
        joinToken: joinTokenByEmail.get(email) ?? null,
      })),
      baseUrl,
      counterparty: auth.name || 'Sovereign Meet',
      dealRoomUrl: null,
    });

    return NextResponse.json(
      {
        success: true,
        meeting: {
          id: meeting.id,
          jitsiRoomId: meeting.jitsiRoomId,
          scheduledFor: meeting.scheduledFor,
          endsAt: meeting.endsAt,
          presentationId,
          joinUrl: `${baseUrl}/meet/${meeting.id}`,
          agendaUrl: '/nexus/agenda',
        },
        invites,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[MeetCreate] Error:', error);
    return fail(500, 'MEETING_CREATION_FAILED', 'No se pudo crear la reunión.');
  }
}
