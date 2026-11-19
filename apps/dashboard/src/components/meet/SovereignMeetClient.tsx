"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { SovereignMeetRoom } from "./SovereignMeetRoom";
import { findPresentation } from "@/lib/nexus/presentations-catalog";
import { LobbyGlobe } from "./LobbyGlobe";
import { shouldShowLobby } from "@/lib/meet/lobby-policy";

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
    /**
     * `?lobby=1` (solo host): muestra el lobby como lo vería un invitado.
     * Es puramente visual: el rol sigue viniendo del token firmado, así que no
     * altera permisos ni la identidad de la reunión.
     */
    previewLobby?: boolean;
}

export function SovereignMeetClient({ joinRef, previewLobby = false }: SovereignMeetClientProps) {
    const [token, setToken] = useState<string | null>(null);
    const [appId, setAppId] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [presentationId, setPresentationId] = useState<string | null>(null);
    const [meetingId, setMeetingId] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [scheduledFor, setScheduledFor] = useState<string | null>(null);
    const [meetingTitle, setMeetingTitle] = useState<string | null>(null);

    /**
     * Sede del anfitrión/deck para dibujar la ruta. Celeste está en Huatulco;
     * cualquier otro deck cae a CDMX. (Ampliar aquí cuando haya más sedes.)
     */
    const DECK_ORIGINS: Record<string, { lat: number; lon: number }> = {
        celeste: { lat: 15.7500, lon: -96.1333 }, // Huatulco, Oax.
    };

    // Lobby propio (no depende de Jitsi): el invitado espera aquí hasta que el host
    // esté dentro. `hostPresent === null` significa "no se pudo saber" → se deja pasar.
    const [hostPresent, setHostPresent] = useState<boolean | null>(null);
    const [entered, setEntered] = useState(false);
    const [entering, setEntering] = useState(false);
    const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);
    const [geoDenied, setGeoDenied] = useState(false);

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
                if (data.meetingId) {
                    setMeetingId(data.meetingId);
                }
                if (typeof data.displayName === "string" && data.displayName.trim()) {
                    setDisplayName(data.displayName.trim());
                }
                if (typeof data.scheduledFor === "string" && data.scheduledFor.trim()) {
                    setScheduledFor(data.scheduledFor);
                }
                if (typeof data.title === "string" && data.title.trim()) {
                    setMeetingTitle(data.title.trim());
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchToken();
    }, [joinRef]);

    useEffect(() => {
        if (role === "host" || !meetingId || entered) return;
        let cancelled = false;

        const check = async () => {
            try {
                const res = await fetch(
                    `/api/v1/meet/host-presence?meetingId=${encodeURIComponent(meetingId)}`,
                    { cache: "no-store" }
                );
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                const present = typeof data.hostPresent === "boolean" ? data.hostPresent : null;
                setHostPresent(present);
                if (present === true) {
                    setEntering(true);
                    window.setTimeout(() => setEntered(true), 650);
                }
            } catch {
                /* si falla, no se bloquea la entrada */
            }
        };

        void check();
        const timer = setInterval(check, 5_000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [role, meetingId, entered]);

    const enterRoom = () => {
        if (entering || entered) return;
        setEntering(true);
        window.setTimeout(() => setEntered(true), 650);
    };

    // Ubicación del invitado: solo se usa en el navegador (no se envía al servidor).
    // Si el permiso ya fue denegado, no se vuelve a preguntar.
    useEffect(() => {
        if ((role === "host" && !previewLobby) || typeof navigator === "undefined" || !navigator.geolocation) return;
        let cancelled = false;

        const ask = async () => {
            try {
                const permissions = (navigator as Navigator & {
                    permissions?: { query: (d: { name: string }) => Promise<{ state: string }> };
                }).permissions;
                if (permissions?.query) {
                    const status = await permissions.query({ name: "geolocation" });
                    if (status.state === "denied") {
                        if (!cancelled) setGeoDenied(true);
                        return;
                    }
                }
            } catch {
                /* sin Permissions API: se intenta igual */
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (cancelled) return;
                    setOrigin({ lat: position.coords.latitude, lon: position.coords.longitude });
                },
                () => {
                    if (!cancelled) setGeoDenied(true);
                },
                { maximumAge: 10 * 60_000, timeout: 8_000, enableHighAccuracy: false }
            );
        };

        void ask();
        return () => {
            cancelled = true;
        };
    }, [role, previewLobby]);

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

    if (!meetingId) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-8">
                <p className="text-zinc-500 text-sm text-center">
                    La sala no devolvió un identificador de reunión válido.
                </p>
            </div>
        );
    }

    const isHost = role === "host";
    const lobbyPreview = isHost && previewLobby;
    // Regla única y testeada en `lib/meet/lobby-policy.ts`.
    const waitingForHost = shouldShowLobby({
        hasMeeting: Boolean(meetingId),
        isHost,
        hostPresent,
        entered,
        previewLobby,
    });
    const deck = findPresentation(presentationId);
    const sessionTitle = deck?.title ?? meetingTitle ?? "Sesión privada";

    if (waitingForHost) {
        const destination = DECK_ORIGINS[presentationId ?? ""] ?? { lat: 19.4326, lon: -99.1332 };
        return (
            <motion.div
                animate={
                    entering
                        ? { scale: 1.08, opacity: 0, filter: "blur(8px)" }
                        : { scale: 1, opacity: 1, filter: "blur(0px)" }
                }
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex min-h-[100dvh] w-full overflow-hidden bg-[#07070B]"
            >
                {/* Escenario (solo desktop): el deck y la hora, con la identidad de la casa */}
                <div className="relative hidden flex-1 flex-col justify-between p-12 sm:flex">
                    <LobbyGlobe
                        className="absolute inset-0 h-full w-full"
                        origin={origin}
                        destination={destination}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07070B] via-[#07070B]/60 to-transparent" />
                    <div className="pointer-events-none absolute -top-40 -left-24 h-[34rem] w-[34rem] rounded-full bg-purple-600/10 blur-[130px]" />
                    <div className="pointer-events-none absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-lime-500/[0.07] blur-[120px]" />

                    <div className="relative z-10">
                        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-lime-400/80">
                            Pandora&apos;s · Sovereign Meet
                        </p>
                        <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white">
                            {sessionTitle}
                        </h1>
                        {deck?.subtitle && (
                            <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-400">{deck.subtitle}</p>
                        )}
                    </div>

                    <div className="relative z-10 space-y-1">
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                            Pandora&apos;s Group · Confidential
                        </p>
                    </div>
                </div>

                {/* Drawer: estado de la sala y entrada */}
                <motion.aside
                    initial={{ x: "100%", opacity: 0.6 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 28, stiffness: 280 }}
                    className="relative z-20 flex w-full flex-col justify-between overflow-y-auto border-l border-lime-500/15 bg-zinc-950/95 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:w-[440px] sm:p-8"
                >
                    <div className="space-y-6">
                        <div className="relative -mx-2 h-44 w-full sm:hidden">
                            <LobbyGlobe
                        className="absolute inset-0 h-full w-full"
                        origin={origin}
                        destination={destination}
                    />
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-lime-400">
                                    Sala de espera
                                </p>
                                <p className="mt-1 text-sm font-semibold text-white sm:hidden">
                                    {sessionTitle}
                                </p>
                            </div>
                            <span
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                                    lobbyPreview
                                        ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${lobbyPreview ? "bg-purple-400" : "bg-amber-400"}`} />
                                {lobbyPreview ? "Vista previa" : "En espera"}
                            </span>
                        </div>

                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-2">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Sesión</p>
                            <p className="text-sm text-zinc-200">{sessionTitle}</p>
                            {scheduledFor && (
                                <>
                                    <p className="pt-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Cuándo</p>
                                    <p className="text-sm text-zinc-200 capitalize">
                                        {new Date(scheduledFor).toLocaleString("es-MX", {
                                            dateStyle: "full",
                                            timeStyle: "short",
                                            timeZone: "America/Mexico_City",
                                        })}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-500" />
                                </span>
                                {lobbyPreview
                                    ? "Así verá el invitado la sala mientras espera"
                                    : "El anfitrión todavía no ha abierto la sala"}
                            </div>
                            <p className="text-xs leading-relaxed text-zinc-500">
                                {lobbyPreview
                                    ? "Entra para probar la transición. Esta vista no cambia tu rol de anfitrión."
                                    : "Entrarás automáticamente cuando esté dentro. Puedes dejar esta ventana abierta."}
                            </p>
                            {origin && (
                                <p className="text-[10px] leading-relaxed text-zinc-600">
                                    Ruta dibujada desde tu ubicación. No se guarda ni se envía al servidor.
                                </p>
                            )}
                            {!origin && geoDenied && (
                                <p className="text-[10px] leading-relaxed text-zinc-600">
                                    Sin ubicación: mostramos una ruta de referencia.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 pt-6">
                        <button
                            type="button"
                            onClick={enterRoom}
                            className="w-full rounded-xl border border-lime-500/30 bg-lime-500/10 px-4 py-3 text-[11px] font-mono uppercase tracking-widest text-lime-200 transition-colors hover:bg-lime-500/20"
                        >
                            {lobbyPreview ? "Entrar a la sala" : "Entrar de todos modos"}
                        </button>
                        <p className="text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                            Tu cámara y micrófono se pedirán al entrar
                        </p>
                    </div>
                </motion.aside>
            </motion.div>
        );
    }

    return (
        <SovereignMeetRoom
            roomName={roomName}
            meetingId={meetingId}
            displayName={displayName ?? (role === "host" ? "Pandora's" : "Participante")}
            role={role || "participant"}
            jwt={token}
            appId={appId}
            presentationId={presentationId}
            scheduledFor={scheduledFor}
            meetingTitle={meetingTitle}
            joinRef={joinRef}
        />
    );
}
