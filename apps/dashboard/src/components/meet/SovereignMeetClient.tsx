"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SovereignMeetRoom } from "./SovereignMeetRoom";
import { useAuth } from "@/components/auth/AuthProvider"; // Assumed existing Auth context

interface SovereignMeetClientProps {
    meetingId: string;
}

export function SovereignMeetClient({ meetingId }: SovereignMeetClientProps) {
    const { user, status } = useAuth();
    
    const [token, setToken] = useState<string | null>(null);
    const [appId, setAppId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait until auth is resolved (even if unauthenticated/guest)
        if (status === "booting" || status === "checking_session") return;

        const fetchToken = async () => {
            try {
                const isGuest = !user;
                const identityId = user?.id || null;
                const displayName = user ? `Usuario ${user.address.substring(0, 4)}` : "Invitado";

                const res = await fetch("/api/v1/meet/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        meetingId,
                        identityId,
                        isGuest,
                    })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "No se pudo obtener acceso a la sala");
                }

                const data = await res.json();
                setToken(data.token);
                setAppId(data.appId);
                setRole(data.role);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchToken();
    }, [meetingId, status, user]);

    if (loading || status === "booting" || status === "checking_session") {
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

    if (!token || !appId) return null;

    return (
        <SovereignMeetRoom 
            roomName={meetingId}
            displayName={user ? `Usuario ${user.address.substring(0, 4)}` : "Invitado"}
            role={role || "guest"}
            jwt={token}
            appId={appId}
        />
    );
}
