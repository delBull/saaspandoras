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

    /** Array of participant internal IDs or identities to invite */
    collaborators?: (string | number)[];
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
        const { canonicalOrgId, hostCollaboratorId, presentationId, scheduledFor, durationMinutes, collaborators } = req;
        
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
        const participantRecords: Array<{ id: string; identityId: string; joinToken: string }> = [];

        if (Array.isArray(collaborators) && collaborators.length > 0) {
            const participantsToInsert = collaborators.map((cId) => {
                const joinToken = crypto.randomBytes(16).toString('hex');
                const record = { id: crypto.randomUUID(), identityId: String(cId), joinToken };
                participantRecords.push(record);
                return {
                    id: record.id,
                    meetingId,
                    identityId: record.identityId,
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
