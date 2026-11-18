import { db, meetings, meetingParticipants } from '@saasfly/db-core';
import crypto from 'crypto';

/**
 * Request payload to create a new Sovereign Meeting.
 */
export interface CreateMeetingRequest {
    /** The authorized tenant context */
    canonicalOrgId: string;
    
    /** The host's collaborator ID (can be null for system-created meetings) */
    hostCollaboratorId?: number | null;
    
    /** Optional presentation or resource linked to this meeting */
    presentationId?: string | null;
    
    /** Scheduled start time, defaults to now if omitted */
    scheduledFor?: string | Date;

    /**
     * Optional meeting length in minutes. When provided, `endsAt` is persisted.
     * Additive field: callers that omit it keep the previous behaviour (endsAt null).
     */
    durationMinutes?: number | null;

    /** Array of participant internal IDs or identities to invite (legacy) */
    collaborators?: (string | number)[];

    /**
     * Participantes de la reunión (NO firmantes del deal).
     * Un meeting puede tener muchos invitados y solo 1-2 firmantes.
     */
    participants?: Array<{ email: string; name?: string | null }>;
}

/**
 * Sovereign Agenda Core
 * ==============================================================
 * Central domain package for creating and managing meetings across
 * all tenants (Nexus, Academy, Forge).
 * 
 * Note: Authorization (Policy Engine) must happen BEFORE calling this API.
 * This class assumes the caller has already resolved `canonicalOrgId` securely.
 */
export class AgendaCore {
    
    /**
     * Creates a new Meeting and its participants in the database.
     */
    static async createMeeting(req: CreateMeetingRequest) {
        const { canonicalOrgId, hostCollaboratorId, presentationId, scheduledFor, durationMinutes, collaborators, participants } = req;
        
        if (!canonicalOrgId) {
            throw new Error("[AgendaCore] canonicalOrgId is required to maintain tenant boundaries.");
        }

        const startsAt = scheduledFor ? new Date(scheduledFor) : new Date();
        const endsAt = typeof durationMinutes === "number" && Number.isFinite(durationMinutes) && durationMinutes > 0
            ? new Date(startsAt.getTime() + durationMinutes * 60_000)
            : null;

        // 1. Jitsi Room Generation (Sovereign URL)
        const jitsiRoomId = `nexus-${canonicalOrgId}-${crypto.randomBytes(8).toString('hex')}`;
        
        // 2. Create the Meeting
        const meetingId = crypto.randomUUID();
        await db.insert(meetings).values({
            id: meetingId,
            canonicalOrgId,
            hostCollaboratorId: hostCollaboratorId || null,
            jitsiRoomId,
            presentationId: presentationId || null,
            status: 'scheduled',
            startsAt,
            endsAt,
        });

        // 3. Assign Collaborators (Participants)
        //    Cada participante recibe un `joinToken` opaco: es lo que permite
        //    identificar quién entró (asistencia) sin exponer su identidad en la URL.
        const participantRecords: Array<{ id: string; identityId: string; email: string | null; joinToken: string }> = [];

        const invitedEmails = (participants ?? [])
            .map((participant) => String(participant.email ?? '').trim().toLowerCase())
            .filter(Boolean);

        const invitedIdentities = Array.isArray(collaborators)
            ? collaborators.map((cId) => String(cId).trim().toLowerCase()).filter(Boolean)
            : [];

        // Los emails explícitos ganan; `collaborators` se mantiene por compatibilidad.
        const invitees = Array.from(new Set([...invitedEmails, ...invitedIdentities]));

        if (invitees.length > 0) {
            const participantsToInsert = invitees.map((invitee) => {
                const joinToken = crypto.randomBytes(16).toString('hex');
                const isEmail = invitee.includes('@');
                const record = { id: crypto.randomUUID(), identityId: invitee, email: isEmail ? invitee : null, joinToken };
                participantRecords.push(record);

                return {
                    id: record.id,
                    meetingId,
                    identityId: record.identityId,
                    email: record.email,
                    joinToken,
                    // Default to anonymous_guest/guest unless specified otherwise
                    participantType: 'anonymous_guest' as const,
                    role: 'guest' as const,
                    followUpStatus: 'pending' as const
                };
            });

            await db.insert(meetingParticipants).values(participantsToInsert);
        }

        return {
            id: meetingId,
            jitsiRoomId,
            presentationId,
            scheduledFor: startsAt.toISOString(),
            endsAt: endsAt ? endsAt.toISOString() : null,
            participants: participantRecords,
        };
    }
}
