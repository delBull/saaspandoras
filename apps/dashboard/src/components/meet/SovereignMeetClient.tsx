"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SovereignMeetRoom } from "./SovereignMeetRoom";

interface SovereignMeetClientProps {
    /**
     * Opaque join reference token (HMAC-signed JWT from /api/v1/tma/nexus/agenda).
     * This is forwarded to /api/v1/meet/token for server-side verification.
     * The client never decodes it — it is treated as an opaque string.
     */
    joinRef?: string;
    meetingId?: string; // Legacy: admin direct join only
}

export function SovereignMeetClient({ joinRef, meetingId }: SovereignMeetClientProps) {
    const [token, setToken] = useState<string | null>(null);
    const [appId, setAppId] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                if (!joinRef && !meetingId) {
                    throw new Error("No se proporcionó referencia de reunión.");
                }

                // --- TMA path: use the opaque signed ref ---
                // The server validates the ref and extracts identity — client sends nothing sensitive.
                const body = joinRef
                    ? { ref: joinRef }
                    : { meetingId }; // Legacy fallback for admin direct-join (SIWE session required)

                const res = await fetch("/api/v1/meet/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // Send session cookie for legacy admin path
                    body: JSON.stringify(body),
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
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchToken();
    }, [joinRef, meetingId]);

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
        />
    );
}
