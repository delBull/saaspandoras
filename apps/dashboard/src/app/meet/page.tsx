import { Metadata } from "next";
import { SovereignMeetClient } from "@/components/meet/SovereignMeetClient";

export const metadata: Metadata = {
    title: "Sovereign Meet | Pandora's",
    description: "Espacio soberano de colaboración.",
};

/**
 * /meet?ref=<signed_join_token>
 *
 * The `ref` is a short-lived HMAC-signed token issued by /api/v1/tma/nexus/agenda.
 * It embeds meetingId, collaboratorId, orgId and expires in 15 minutes.
 * SovereignMeetClient forwards it opaquely to /api/v1/meet/token for server-side verification.
 *
 * NOTE: The old /meet/[meetingId] route still exists for direct dashboard access (e.g., admin).
 * This new route is the entry point for all TMA deep links.
 */
export default async function MeetRefPage({
    searchParams,
}: {
    searchParams: Promise<{ ref?: string }>;
}) {
    const { ref } = await searchParams;

    if (!ref) {
        return (
            <main className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
                <span className="text-2xl mb-4">⛔</span>
                <h1 className="text-lg font-bold tracking-widest uppercase mb-2">Enlace Inválido</h1>
                <p className="text-zinc-500 text-sm text-center">
                    Este enlace de reunión no es válido o ha caducado.
                </p>
            </main>
        );
    }

    return (
        <main className="w-full h-screen bg-black overflow-hidden">
            <SovereignMeetClient joinRef={ref} />
        </main>
    );
}
