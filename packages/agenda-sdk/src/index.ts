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
        const { canonicalOrgId, hostCollaboratorId, presentationId, scheduledFor, collaborators } = req;
        
        if (!canonicalOrgId) {
            throw new Error("[AgendaCore] canonicalOrgId is required to maintain tenant boundaries.");
        }

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
            startsAt: scheduledFor ? new Date(scheduledFor) : new Date(),
        });

        // 3. Assign Collaborators (Participants)
        if (Array.isArray(collaborators) && collaborators.length > 0) {
            const participantsToInsert = collaborators.map((cId) => ({
                id: crypto.randomUUID(),
                meetingId,
                identityId: String(cId),
                // Default to anonymous_guest/guest unless specified otherwise
                participantType: 'anonymous_guest' as const, 
                role: 'guest' as const,
                followUpStatus: 'pending' as const
            }));

            await db.insert(meetingParticipants).values(participantsToInsert);
        }

        return {
            id: meetingId,
            jitsiRoomId,
            presentationId,
            scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : new Date().toISOString()
        };
    }
}
