import { Metadata } from "next";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SovereignMeetClient } from "@/components/meet/SovereignMeetClient";

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
export default async function MeetPage({ params }: { params: Promise<{ meetingId: string }> }) {
    const { meetingId } = await params;
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

    // Generate a server-side signed joinRef (same mechanism as /agenda endpoint).
    // collaboratorId = 'guest:<meetingId>' → token endpoint grants 'participant' role.
    const joinRef = jwt.sign(
        { meetingId, collaboratorId: `guest:${meetingId}`, orgId },
        MEET_JOIN_SECRET,
        { algorithm: "HS256", expiresIn: "15m" }
    );

    return (
        <main className="w-full h-screen bg-black overflow-hidden">
            <SovereignMeetClient joinRef={joinRef} />
        </main>
    );
}
