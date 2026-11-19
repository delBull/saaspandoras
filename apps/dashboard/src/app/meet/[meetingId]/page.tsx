import { Metadata } from "next";
import jwt from "jsonwebtoken";
import { db } from "@saasfly/db-core";
import { meetings } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { SovereignMeetClient } from "@/components/meet/SovereignMeetClient";
import { getNexusAuthContext } from "@saasfly/shared";
import { resolveParticipantJoin } from "@/lib/meet/participant-join";

export const metadata: Metadata = {
    title: "Sovereign Meet | Pandora's",
    description: "Espacio soberano de colaboración.",
};

/**
 * /meet/[meetingId] — Legacy Entry Point (Booking Confirmation Links)
 * ============================================================================
 * This route is used by two callers:
 *   1. syncBookingPipeline.ts:111 — generates links sent to leads via SMS/email.
 *      These leads are NOT Nexus collaborators; they arrive unauthenticated.
 *   2. Admin/host direct access from the Nexus dashboard.
 *
 * SECURITY FIX (commit 7a2fc296):
 *   /api/v1/meet/token no longer accepts raw meetingId + identityId from client body.
 *   To keep this legacy URL working, this Server Component generates a short-lived
 *   (15min) HMAC-signed joinRef on the server side — exactly the same mechanism
 *   used by the TMA /agenda endpoint.
 *
 *   For guests (leads), collaboratorId is set to 'guest:<meetingId>' so the token
 *   endpoint grants them the 'participant' role without requiring Nexus membership.
 *
 * If MEET_JOIN_SECRET is not configured, we render a clear error instead of passing
 *   a null joinRef that would result in a cryptic 400 from the token endpoint.
 */
export default async function MeetPage({
    params,
    searchParams,
}: {
    params: Promise<{ meetingId: string }>;
    searchParams: Promise<{ p?: string }>;
}) {
    const { meetingId } = await params;
    const { p: participantToken } = await searchParams;
    const MEET_JOIN_SECRET = process.env.MEET_JOIN_SECRET;

    if (!MEET_JOIN_SECRET) {
        return (
            <main className="w-full h-screen bg-black flex flex-col items-center justify-center text-white p-8">
                <span className="text-3xl mb-4">⚙️</span>
                <h1 className="text-lg font-bold tracking-widest uppercase mb-2">Reunión no disponible</h1>
                <p className="text-zinc-500 text-sm text-center">
                    El servidor no está configurado para reuniones. Por favor contacta al administrador.
                </p>
            </main>
        );
    }

    // Fetch meeting to get orgId — needed for the cross-tenant boundary in /meet/token
    let orgId = "pandoras";
    try {
        const [meeting] = await db.select({ canonicalOrgId: meetings.canonicalOrgId })
            .from(meetings)
            .where(eq(meetings.id, meetingId));
        if (meeting?.canonicalOrgId) {
            orgId = meeting.canonicalOrgId;
        }
    } catch {
        // Non-fatal — we proceed with default orgId
    }

    const authCtx = await getNexusAuthContext();
    
    // Asistencia: el link personal del email (?p=<joinToken>) identifica al invitado
    // y marca `joined_at` una sola vez. Es la única fuente de verdad de asistencia.
    let participantIdentity: string | null = null;
    let participantId: string | null = null;
    if (participantToken) {
        try {
            const join = await resolveParticipantJoin(meetingId, participantToken);
            if (join) {
                participantIdentity = join.identityId;
                participantId = join.participantId;
            }
        } catch {
            // No bloquea la entrada: si el registro de asistencia falla, la sala sigue.
            console.warn("[Meet] No se pudo registrar la asistencia del participante");
        }
    }

    // We strictly use the authenticated collaborator ID if present.
    // If they are a guest, they remain 'guest:<meetingId>'.
    // The Jitsi JaaS token generation in /api/v1/meet/token handles the roles based on this ID.
    const collaboratorId = authCtx.isAuthenticated
        ? authCtx.collaboratorId
        : participantId
        ? `guest:${meetingId}:${participantId}`
        : `guest:${meetingId}`;
    const name = authCtx.isAuthenticated
        ? authCtx.name
        : participantIdentity?.split("@")[0] || "Invitado";
    const email = authCtx.isAuthenticated
        ? authCtx.email
        : participantIdentity || "guest@pandoras.finance";

    const joinRef = jwt.sign(
        { meetingId, collaboratorId: String(collaboratorId), orgId, name, email },
        MEET_JOIN_SECRET,
        { algorithm: "HS256", expiresIn: "15m" }
    );

    return (
        <main className="w-full h-screen bg-black overflow-hidden">
            <SovereignMeetClient joinRef={joinRef} />
        </main>
    );
}
