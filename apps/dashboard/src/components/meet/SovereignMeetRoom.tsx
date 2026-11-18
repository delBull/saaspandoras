"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, MonitorPlay, PhoneOff, X, BookOpen, NotebookPen, Save } from "lucide-react";
import { findPresentation } from "@/lib/nexus/presentations-catalog";

interface SovereignMeetRoomProps {
    roomName: string; // JaaS room name — appId prefix is added internally
    meetingId: string; // Canonical meeting UUID (for presentation state + end)
    displayName: string;
    role: string;
    jwt: string;
    appId: string;
    presentationId?: string | null;
}

// Toolbar buttons for desktop (full feature set)
const DESKTOP_TOOLBAR: string[] = [
    'microphone',
    'camera',
    'desktop',
    'fullscreen',
    'hangup',
    'chat',
    'raisehand',
    'tileview',
    'select-background',
    'settings',
    'fodeviceselection',
    'filmstrip',
    'videoquality',
    'closedcaptions',
    'mute-everyone',
    'security',
];

// Minimal toolbar for mobile (fits in 375px without collapsing)
const MOBILE_TOOLBAR: string[] = [
    'microphone',
    'camera',
    'hangup',
    'chat',
    'raisehand',
    'tileview',
];

// Host-only extras (added on top of desktop set)
const HOST_EXTRAS: string[] = ['recording', 'mute-everyone', 'security'];

const PRESENTATION_POLL_MS = 3000; // fallback si el navegador no soporta SSE

interface PresentationState {
    open: boolean;
    slide: number;
    status: string;
}

export function SovereignMeetRoom({
    roomName,
    meetingId,
    displayName,
    role,
    jwt,
    appId,
    presentationId
}: SovereignMeetRoomProps) {
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const deckFrameRef = useRef<HTMLIFrameElement>(null);

    const isHost = role === "host" || role === "co_host";

    // --- Injected presentation state (host-controlled, DB-backed) ---
    const [deckState, setDeckState] = useState<PresentationState>({ open: false, slide: 0, status: "scheduled" });
    const [deckError, setDeckError] = useState<string | null>(null);
    const [deckBusy, setDeckBusy] = useState(false);
    const [showScript, setShowScript] = useState(false);
    const [notes, setNotes] = useState("");
    const [notesLoaded, setNotesLoaded] = useState(false);
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [ending, setEnding] = useState(false);
    const [meetingEnded, setMeetingEnded] = useState(false);

    const hasDeck = Boolean(presentationId);
    const presentation = useMemo(() => findPresentation(presentationId), [presentationId]);
    const scriptBlocks = presentation?.script ?? [];
    const currentBlock = scriptBlocks[deckState.slide];

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Participants follow the host. Transporte: SSE (push del servidor) con
    // fallback a polling si EventSource no está disponible o falla de forma persistente.
    useEffect(() => {
        if (!hasDeck) return;
        let cancelled = false;
        let source: EventSource | null = null;
        let interval: ReturnType<typeof setInterval> | null = null;

        const applyState = (data: any) => {
            if (cancelled || !data || data.error) return;
            setDeckState({
                open: Boolean(data.open),
                slide: Number.isInteger(data.slide) ? data.slide : 0,
                status: data.status ?? "scheduled",
            });
            if (data.status === "ended") setMeetingEnded(true);
        };

        const pollOnce = async () => {
            try {
                const res = await fetch(`/api/v1/meet/presentation?meetingId=${encodeURIComponent(meetingId)}`, {
                    cache: "no-store",
                });
                if (!res.ok) return;
                applyState(await res.json());
            } catch {
                // Silencioso a propósito: un fallo de red no debe tumbar la sala.
            }
        };

        const startPolling = () => {
            if (interval || cancelled) return;
            void pollOnce();
            interval = setInterval(pollOnce, PRESENTATION_POLL_MS);
        };

        if (typeof window !== "undefined" && typeof window.EventSource === "function") {
            try {
                source = new EventSource(
                    `/api/v1/meet/presentation/stream?meetingId=${encodeURIComponent(meetingId)}`
                );
                source.onmessage = (event) => {
                    try {
                        applyState(JSON.parse(event.data));
                    } catch {
                        // mensaje parcial/keep-alive: se ignora
                    }
                };
                // EventSource reconecta solo; tras error persistente caemos a polling.
                source.onerror = () => {
                    if (source && source.readyState === EventSource.CLOSED) {
                        source.close();
                        source = null;
                        startPolling();
                    }
                };
            } catch {
                startPolling();
            }
        } else {
            startPolling();
        }

        return () => {
            cancelled = true;
            source?.close();
            if (interval) clearInterval(interval);
        };
    }, [hasDeck, meetingId]);

    // Push the synchronized slide index into the deck iframe.
    useEffect(() => {
        if (!deckState.open) return;
        const frame = deckFrameRef.current;
        if (!frame?.contentWindow) return;
        frame.contentWindow.postMessage({ type: "pandora:presentation:go", index: deckState.slide }, "*");
    }, [deckState.open, deckState.slide]);

    // Guión contextual de ESTA sesión (host-only): se carga al abrir el panel.
    const loadNotes = useCallback(async () => {
        try {
            const res = await fetch(`/api/v1/meet/notes?meetingId=${encodeURIComponent(meetingId)}`, {
                cache: "no-store",
            });
            if (!res.ok) return;
            const data = await res.json();
            setNotes(data.notes ?? "");
            setNotesLoaded(true);
        } catch {
            setNotesLoaded(true);
        }
    }, [meetingId]);

    const saveNotes = useCallback(async () => {
        setNotesSaving(true);
        setNotesSaved(false);
        try {
            const res = await fetch("/api/v1/meet/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingId, notes }),
            });
            if (res.ok) setNotesSaved(true);
        } catch {
            // sin éxito visible: el host ve que no se guardó
        } finally {
            setNotesSaving(false);
        }
    }, [meetingId, notes]);

    useEffect(() => {
        if (showNotes && isHost && !notesLoaded) void loadNotes();
    }, [showNotes, isHost, notesLoaded, loadNotes]);

    const updateDeck = useCallback(
        async (patch: { open?: boolean; slide?: number }) => {
            setDeckBusy(true);
            setDeckError(null);
            try {
                const res = await fetch("/api/v1/meet/presentation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meetingId, ...patch }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setDeckError(data.error ?? "No se pudo actualizar la presentación");
                    return;
                }
                setDeckState({
                    open: Boolean(data.open),
                    slide: Number.isInteger(data.slide) ? data.slide : 0,
                    status: data.status ?? deckState.status,
                });
            } catch {
                setDeckError("Error de red al actualizar la presentación");
            } finally {
                setDeckBusy(false);
            }
        },
        [deckState.status]
    );

    const endMeeting = useCallback(async () => {
        setEnding(true);
        try {
            const res = await fetch("/api/v1/meet/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingId }),
            });
            if (res.ok) {
                setMeetingEnded(true);
                return true;
            }
            return false;
        } catch {
            return false;
        } finally {
            setEnding(false);
        }
    }, [meetingId]);

    const toolbarButtons = isMobile
        ? MOBILE_TOOLBAR
        : isHost
        ? [...new Set([...DESKTOP_TOOLBAR, ...HOST_EXTRAS])]
        : DESKTOP_TOOLBAR;

    // JaaS (8x8.vc) room format: <appId>/<roomName>
    const fullRoomName = `${appId}/${roomName}`;

    return (
        <div
            className="w-full h-full min-h-[100dvh] bg-black overflow-hidden relative flex flex-col"
            ref={containerRef}
        >
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-10">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-lime-500/20 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="w-10 h-10 animate-spin text-lime-500 relative z-10" />
                    </div>
                    <p className="text-lime-400 font-mono text-[10px] tracking-widest uppercase animate-pulse">
                        Estableciendo Conexión Soberana...
                    </p>
                </div>
            )}

            {/* Host controls: presentation + end meeting */}
            {isHost && (
                <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2">
                    {hasDeck && (
                        <>
                            <button
                                type="button"
                                disabled={deckBusy || meetingEnded}
                                onClick={() => updateDeck({ open: !deckState.open, slide: deckState.slide })}
                                className="bg-lime-500 text-black px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-lime-400 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-lime-500/20 border border-lime-400/50"
                            >
                                <MonitorPlay className="w-4 h-4" />
                                {deckState.open ? "Ocultar deck" : "Presentar deck"}
                            </button>
                            {deckState.open && (
                                <div className="flex items-center gap-1 bg-black/70 border border-white/15 rounded-full px-1.5 py-1 backdrop-blur">
                                    <button
                                        type="button"
                                        disabled={deckBusy || deckState.slide === 0}
                                        onClick={() => updateDeck({ slide: Math.max(deckState.slide - 1, 0) })}
                                        className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-40 text-white"
                                        title="Slide anterior"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-[10px] font-mono text-zinc-300 min-w-[3rem] text-center">
                                        {deckState.slide + 1}/{scriptBlocks.length || "?"}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={deckBusy}
                                        onClick={() => updateDeck({ slide: deckState.slide + 1 })}
                                        className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-40 text-white"
                                        title="Slide siguiente"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowNotes((v) => !v)}
                                className={`px-3 py-2 rounded-full text-xs font-mono flex items-center gap-1.5 border backdrop-blur transition-colors ${
                                    showNotes
                                        ? "bg-sky-500/30 border-sky-400/50 text-sky-100"
                                        : "bg-black/60 border-white/15 text-zinc-300 hover:text-white"
                                }`}
                                title="Contexto de la sesión (solo host)"
                            >
                                <NotebookPen className="w-3.5 h-3.5" />
                                Contexto
                            </button>
                            {presentation && (
                                <button
                                    type="button"
                                    onClick={() => setShowScript((v) => !v)}
                                    className={`px-3 py-2 rounded-full text-xs font-mono flex items-center gap-1.5 border backdrop-blur transition-colors ${
                                        showScript
                                            ? "bg-purple-500/30 border-purple-400/50 text-purple-100"
                                            : "bg-black/60 border-white/15 text-zinc-300 hover:text-white"
                                    }`}
                                    title="Guión del presentador"
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Guión
                                </button>
                            )}
                        </>
                    )}
                    <button
                        type="button"
                        disabled={ending || meetingEnded}
                        onClick={endMeeting}
                        className="bg-red-600/90 hover:bg-red-500 text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors flex items-center gap-2"
                        title="Finaliza la reunión y encola el seguimiento por email"
                    >
                        <PhoneOff className="w-4 h-4" />
                        {meetingEnded ? "Finalizada" : ending ? "Finalizando..." : "Finalizar"}
                    </button>
                </div>
            )}

            {isHost && deckError && (
                <div className="absolute top-20 left-4 z-30 max-w-xs text-[11px] text-red-300 bg-red-950/80 border border-red-500/40 rounded-lg px-3 py-2">
                    {deckError}
                </div>
            )}

            {/* Presenter script (host only) */}
            {isHost && showScript && presentation && (
                <aside className="absolute top-20 right-4 z-30 w-80 max-h-[70dvh] overflow-y-auto rounded-xl bg-black/85 border border-purple-500/30 backdrop-blur p-4 space-y-3">
                    <header className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-purple-300">Guión · {presentation.title}</p>
                            <p className="text-[10px] text-zinc-500">{presentation.targetMinutes} min objetivo</p>
                        </div>
                        <button type="button" onClick={() => setShowScript(false)} className="text-zinc-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </header>

                    {currentBlock ? (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-white">
                                {deckState.slide + 1}. {currentBlock.title}
                                <span className="ml-2 text-[10px] font-mono text-zinc-500">{currentBlock.minutes} min</span>
                            </p>
                            <ul className="space-y-1.5">
                                {currentBlock.beats.map((beat, index) => (
                                    <li key={index} className="text-[11px] text-zinc-300 leading-relaxed flex gap-2">
                                        <span className="text-purple-400">·</span>
                                        <span>{beat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-[11px] text-zinc-400">Este slide no tiene notas de conducción.</p>
                    )}

                    {presentation.proposalHref && (
                        <a
                            href={presentation.proposalHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-mono text-emerald-200"
                        >
                            Abrir propuesta del deal
                        </a>
                    )}

                    <div className="pt-2 border-t border-white/10 space-y-1">
                        <p className="text-[10px] font-mono uppercase text-zinc-500">Reglas</p>
                        {presentation.guardrails.map((rule, index) => (
                            <p key={index} className="text-[10px] text-zinc-400 leading-relaxed">— {rule}</p>
                        ))}
                    </div>
                </aside>
            )}

            {/* Contexto de la sesión (host-only, persistido por reunión) */}
            {isHost && showNotes && (
                <aside className="absolute top-20 right-4 z-30 w-80 max-h-[70dvh] overflow-y-auto rounded-xl bg-black/85 border border-sky-500/30 backdrop-blur p-4 space-y-3">
                    <header className="flex items-center justify-between">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-sky-300">Contexto de esta sesión</p>
                        <button type="button" onClick={() => setShowNotes(false)} className="text-zinc-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </header>
                    <textarea
                        value={notes}
                        onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
                        rows={8}
                        placeholder="Acuerdos previos, objeciones conocidas, compromisos de la sesión anterior..."
                        className="w-full rounded-lg bg-black/60 border border-white/10 px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-sky-500/50"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500">
                            {notesSaved ? "Guardado" : `${notes.length}/8000`}
                        </span>
                        <button
                            type="button"
                            disabled={notesSaving}
                            onClick={saveNotes}
                            className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/15 hover:bg-sky-500/25 disabled:opacity-50 text-sky-100 text-[11px] font-mono flex items-center gap-1.5"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {notesSaving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </aside>
            )}

            {/* Injected deck: same slide for everyone, controlled by the host */}
            {deckState.open && presentation && (
                <div className="absolute inset-0 z-20 bg-black flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/80">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-lime-400">
                            Presentación soberana · {presentation.title}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500">
                                Slide {deckState.slide + 1}
                                {isHost ? " · control del host" : " · siguiendo al host"}
                            </span>
                            {isHost && (
                                <button
                                    type="button"
                                    onClick={() => updateDeck({ open: false })}
                                    className="text-zinc-400 hover:text-white"
                                    title="Cerrar deck"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <iframe
                        ref={deckFrameRef}
                        src={`/pitch/${presentation.slug}?embed=1&slide=${deckState.slide}`}
                        title={presentation.title}
                        className="flex-1 w-full border-0 bg-black"
                        allow="fullscreen"
                    />
                </div>
            )}

            <div className="flex-1 w-full relative">
                <JitsiMeeting
                    domain="8x8.vc"
                    roomName={fullRoomName}
                    jwt={jwt}
                    configOverwrite={{
                        defaultLanguage: "es",
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: true,
                        disableDeepLinking: true,

                        // --- Performance: optimized for 1:1 booking calls ---
                        resolution: 720,
                        maxFullResolutionParticipants: 2,
                        enableLayerSuspension: true,
                        p2p: {
                            enabled: true, // P2P for 2-person calls (host + lead) — less latency
                        },

                        // --- Noise / audio quality ---
                        enableNoAudioDetection: true,
                        enableNoisyMicDetection: true,

                        // --- Branding (configOverwrite path — supported in JaaS) ---
                        hideConferenceSubject: false, // Show the meeting title
                        disableThirdPartyRequests: false,

                        // --- Toolbar ---
                        toolbarButtons,
                    }}
                    interfaceConfigOverwrite={{
                        // Legacy flags — still honored by some JaaS deployments.
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        TOOLBAR_ALWAYS_VISIBLE: !isMobile, // Auto-hide on mobile saves space
                        DEFAULT_REMOTE_DISPLAY_NAME: "Participante",
                        DISABLE_VIDEO_BACKGROUND: false, // Allow virtual backgrounds
                    }}
                    userInfo={{
                        displayName,
                        email: "",
                    }}
                    onApiReady={(externalApi) => {
                        setLoading(false);

                        externalApi.on("videoConferenceJoined", () => {
                            console.log("[Sovereign Meet] Joined room.");
                        });

                        externalApi.on("readyToClose", () => {
                            // Host closing the call ends the meeting (queues follow-up).
                            if (isHost) {
                                void endMeeting();
                            }
                            if (typeof window !== "undefined") {
                                window.location.href = "/";
                            }
                        });
                    }}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = "100%";
                        iframeRef.style.width = "100%";
                        iframeRef.style.border = "none";
                        iframeRef.style.background = "#000000";
                        // Mobile: ensure no rubber-banding / overscroll
                        iframeRef.style.overflow = "hidden";
                        iframeRef.style.position = "absolute";
                        iframeRef.style.inset = "0";
                    }}
                />
            </div>
        </div>
    );
}
