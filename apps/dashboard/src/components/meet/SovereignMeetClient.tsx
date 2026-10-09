"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SovereignMeetRoom } from "./SovereignMeetRoom";

/**
 * 🏛️ ARCHITECTURE NOTE: Sovereign Agenda Core (Jitsi Adapter)
 * ==============================================================
 * This component acts as the Meeting Adapter for Jitsi.
 * In a decoupled architecture, this UI shouldn't care if the underlying engine is Jitsi, Zoom, or WebRTC.
 * It strictly takes a `joinRef` (opaque token) and resolves the meeting parameters.
 * 
 * Future Integration Checklist (Academy & other Tenants):
 * - [ ] Extensibility: Allow Academy to pass a custom UI wrapper or layout instead of the hardcoded `bg-black`.
 * - [ ] Provider Agnostic: Move the JWT fetch (`/api/v1/meet/token`) behind an interface so Academy can swap the meeting provider if needed.
 * - [ ] Presentation Decoupling: Currently it expects `presentationId` to launch a Pitch. Academy might need to launch a "Course Module" instead. Consider renaming to `resourceId` and passing a `resourceType` to determine what to launch.
 */

interface SovereignMeetClientProps {
    /**
     * Opaque join reference token (HMAC-signed HS256 JWT).
     * Issued by either:
     *   - /api/v1/tma/nexus/agenda  → for TMA collaborators (15min TTL)
     *   - /meet/[meetingId]/page.tsx server component → for booking confirmation links / guests
     *   - /meet/page.tsx server component → for ?ref= query param links
     *
     * The client never decodes it. It is forwarded opaquely to /api/v1/meet/token
     * which verifies the signature and generates the Jitsi JWT.
     */
    joinRef: string;
}

export function SovereignMeetClient({ joinRef }: SovereignMeetClientProps) {
    const [token, setToken] = useState<string | null>(null);
    const [appId, setAppId] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [presentationId, setPresentationId] = useState<string | null>(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await fetch("/api/v1/meet/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ref: joinRef }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "No se pudo obtener acceso a la sala.");
                }

                const data = await res.json();
                setToken(data.token);
                setAppId(data.appId);
                setRoomName(data.roomName);
                setRole(data.role);
                if (data.presentationId) {
                    setPresentationId(data.presentationId);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchToken();
    }, [joinRef]);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
                <Loader2 className="w-8 h-8 animate-spin text-lime-500 mb-4" />
                <p className="text-[10px] tracking-widest text-lime-400 font-mono uppercase animate-pulse">
                    Autenticando identidad soberana...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-8">
                <div className="w-16 h-16 bg-red-500/10 flex items-center justify-center rounded-full mb-6">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h1 className="text-xl font-bold tracking-widest uppercase mb-4">Acceso Denegado</h1>
                <p className="text-zinc-500 text-sm mb-8 text-center">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="border border-zinc-800 text-zinc-400 px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (!token || !appId || !roomName) return null;

    return (
        <SovereignMeetRoom
            roomName={roomName}
            displayName={`Participante ${role === "host" ? "(Host)" : ""}`}
            role={role || "participant"}
            jwt={token}
            appId={appId}
            presentationId={presentationId}
        />
    );
}
