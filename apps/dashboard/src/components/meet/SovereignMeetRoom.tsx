"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, MonitorPlay, PhoneOff, X, BookOpen, NotebookPen, Save, Link2, Check, ClipboardList } from "lucide-react";
import { findPresentation } from "@/lib/nexus/presentations-catalog";
import { MeetClosedScreen } from "./MeetClosedScreen";
import { shortMeetingPath, shareOrCopyMeeting } from "@/lib/meet/meeting-links";

interface SovereignMeetRoomProps {
    roomName: string; // JaaS room name — appId prefix is added internally
    meetingId: string; // Canonical meeting UUID (for presentation state + end)
    displayName: string;
    role: string;
    jwt: string;
    appId: string;
    presentationId?: string | null;
    scheduledFor?: string | null;
    meetingTitle?: string | null;
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
    'reactions',
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
    dealPublicId?: string | null;
}

export function SovereignMeetRoom({
    roomName,
    meetingId,
    displayName,
    role,
    jwt,
    appId,
    presentationId,
    scheduledFor,
    meetingTitle
}: SovereignMeetRoomProps) {
    const [loading, setLoading] = useState(true);
    const [frameError, setFrameError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const externalApiRef = useRef<{ executeCommand?: (command: string) => void } | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const deckFrameRef = useRef<HTMLIFrameElement>(null);

    const isHost = role === "host" || role === "co_host";

    // --- Injected presentation state (host-controlled, DB-backed) ---
    const [deckState, setDeckState] = useState<PresentationState>({ open: false, slide: 0, status: "scheduled" });
    const [deckError, setDeckError] = useState<string | null>(null);
    const [deckMeta, setDeckMeta] = useState<{
        title: string;
        slug: string;
        guardrails: string[];
        targetMinutes: number;
        script: Array<{ slide: string; title: string; notes: string[]; minutes?: number }>;
    } | null>(null);
    const [deckBusy, setDeckBusy] = useState(false);
    const [showScript, setShowScript] = useState(false);
    const [notes, setNotes] = useState("");
    const [notesLoaded, setNotesLoaded] = useState(false);
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [ending, setEnding] = useState(false);

    // Minuta de la sesión (acciones) + resumen de grabación
    const [showMinutes, setShowMinutes] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [minutesItems, setMinutesItems] = useState<Array<{ id: string; task: string; assigneeName?: string | null; status: string }>>([]);
    const [minutesLoaded, setMinutesLoaded] = useState(false);
    const [minutesLoading, setMinutesLoading] = useState(false);
    const [minutesError, setMinutesError] = useState<string | null>(null);
    const [newTask, setNewTask] = useState("");
    const [newAssignee, setNewAssignee] = useState("");
    const [savingTask, setSavingTask] = useState(false);
    const [processingRecording, setProcessingRecording] = useState(false);
    const [recordingSummary, setRecordingSummary] = useState<string | null>(null);
    const [meetingEnded, setMeetingEnded] = useState(false);
    // "ended" = se cerró para todos; "left" = el usuario salió y la sala sigue.
    const [exitState, setExitState] = useState<"ended" | "left" | null>(null);
    const meetingEndedRef = useRef(false);
    // null = desconocido (no se muestra aviso). Solo aplica a invitados.
    const [hostPresent, setHostPresent] = useState<boolean | null>(null);

    /**
     * Delega permisos de dispositivos al iframe cross-origin de JaaS.
     * El SDK no declara `allow`, y el navegador lo exige aparte del header
     * Permissions-Policy del documento padre.
     */
    const applyIframePermissions = useCallback(() => {
        const frame = containerRef.current?.querySelector("iframe");
        if (!frame) return false;
        // Forma "bare": cada feature se concede al origen del propio iframe (8x8.vc).
        // Es la sintaxis que entienden Chromium, Firefox y Safari; `*` no es universal.
        frame.allow = "camera; microphone; display-capture; fullscreen; autoplay; clipboard-write";
        frame.allowFullscreen = true;
        return true;
    }, []);

    const hasDeck = Boolean(presentationId);
    const catalogPresentation = useMemo(() => findPresentation(presentationId), [presentationId]);

    // El guión y las reglas vienen del CMS (DB) cuando está sembrado; el catálogo
    // versionado queda como respaldo explícito.
    const presentation = deckMeta ?? catalogPresentation;
    const scriptBlocks: Array<{ slide: string; title: string; notes: string[]; minutes?: number }> =
        (deckMeta?.script as any) ??
        (catalogPresentation?.script ?? []).map((block) => ({
            slide: block.slide,
            title: block.title,
            notes: block.beats,
            minutes: block.minutes,
        }));
    const guardrails = deckMeta?.guardrails ?? catalogPresentation?.guardrails ?? [];
    const deckTitle = deckMeta?.title ?? catalogPresentation?.title ?? meetingTitle ?? "Presentación";
    const currentBlock = scriptBlocks[deckState.slide];

    // Aviso "esperando al anfitrión" para invitados. Sondeo ligero; no bloquea la sala.
    useEffect(() => {
        if (isHost) return;
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
                setHostPresent(typeof data.hostPresent === "boolean" ? data.hostPresent : null);
            } catch {
                /* silencioso: es un aviso de UI, no un requisito para entrar */
            }
        };

        void check();
        const timer = setInterval(check, 15_000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [isHost, meetingId]);

    // Cuando la reunión se cierra (el host finaliza o el estado pasa a 'ended'),
    // los participantes deben salir de la sala, no quedarse colgados como en un
    // "end meeting for all" de Zoom/Meet.
    useEffect(() => {
        meetingEndedRef.current = meetingEnded;
    }, [meetingEnded]);

    useEffect(() => {
        if (!meetingEnded) return;
        try {
            externalApiRef.current?.executeCommand?.("hangup");
        } catch {
            /* si el SDK aún no está listo, el overlay de cierre cubre el caso */
        }
    }, [meetingEnded]);

    // Si el script de Jitsi no carga (CSP, red, bloqueo del navegador), esto evita
    // que el usuario se quede para siempre en "Estableciendo conexión soberana".
    useEffect(() => {
        if (!loading) return;
        const timer = setTimeout(() => {
            setFrameError("La sala no respondió. Revisa tu conexión e inténtalo de nuevo.");
        }, 15_000);
        return () => clearTimeout(timer);
    }, [loading, retryKey]);

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
            setDeckState((prev) => ({
                open: Boolean(data.open),
                slide: Number.isInteger(data.slide) ? data.slide : prev.slide,
                status: data.status ?? prev.status,
                dealPublicId:
                    typeof data.dealPublicId === "string" ? data.dealPublicId : prev.dealPublicId ?? null,
            }));
            if (data.deck) setDeckMeta(data.deck);
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

        // Estado inicial + meta del deck (el SSE solo transporta cambios de slide).
        void pollOnce();

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

    // Permanencia real: el cliente reporta join / heartbeat / leave. El servidor
    // acumula sesiones y el seguimiento usa la duración, no solo "abrió el link".
    useEffect(() => {
        let stopped = false;
        let timer: ReturnType<typeof setInterval> | null = null;

        const report = async (event: "join" | "heartbeat" | "leave") => {
            try {
                await fetch("/api/v1/meet/presence", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meetingId, event }),
                    keepalive: event !== "heartbeat",
                });
            } catch {
                // La sala no se cae por un fallo de telemetría de presencia.
            }
        };

        const start = () => {
            if (stopped) return;
            void report("join");
            timer = setInterval(() => void report("heartbeat"), 30_000);
        };

        // Arranca cuando el usuario realmente entra a la conferencia.
        const timeout = setTimeout(start, 4_000);

        const handleExit = () => {
            if (stopped) return;
            stopped = true;
            if (timer) clearInterval(timer);
            clearTimeout(timeout);
            try {
                const payload = JSON.stringify({ meetingId, event: "leave" });
                const blob = new Blob([payload], { type: "application/json" });
                navigator.sendBeacon?.("/api/v1/meet/presence", blob);
            } catch {
                // sin beacon: el servidor cierra la sesión por lastSeenAt
            }
        };

        window.addEventListener("pagehide", handleExit);
        window.addEventListener("beforeunload", handleExit);

        return () => {
            if (timer) clearInterval(timer);
            clearTimeout(timeout);
            window.removeEventListener("pagehide", handleExit);
            window.removeEventListener("beforeunload", handleExit);
        };
    }, [meetingId]);

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

    const loadMinutes = useCallback(async () => {
        setMinutesLoading(true);
        setMinutesError(null);
        try {
            const res = await fetch(`/api/v1/meet/action-items?meetingId=${encodeURIComponent(meetingId)}`, {
                cache: "no-store",
            });
            if (!res.ok) {
                setMinutesError("No se pudo cargar la minuta.");
                return;
            }
            const data = await res.json();
            setMinutesItems(Array.isArray(data.items) ? data.items : []);
        } catch {
            setMinutesError("Error de red al cargar la minuta.");
        } finally {
            setMinutesLoading(false);
            setMinutesLoaded(true);
        }
    }, [meetingId]);

    const addActionItem = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        const task = newTask.trim();
        if (!task) return;
        setSavingTask(true);
        setMinutesError(null);
        try {
            const res = await fetch("/api/v1/meet/action-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    meetingId,
                    task,
                    ...(newAssignee.trim() ? { assigneeName: newAssignee.trim() } : {}),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMinutesError(data.error ?? "No se pudo guardar la tarea.");
                return;
            }
            if (data.item) setMinutesItems((prev) => [...prev, data.item]);
            setNewTask("");
            setNewAssignee("");
        } catch {
            setMinutesError("Error de red al guardar la tarea.");
        } finally {
            setSavingTask(false);
        }
    }, [meetingId, newTask, newAssignee]);

    const processRecording = useCallback(async (file: File) => {
        setProcessingRecording(true);
        setMinutesError(null);
        setRecordingSummary(null);
        try {
            const form = new FormData();
            form.append("meetingId", meetingId);
            form.append("file", file);
            const res = await fetch("/api/v1/internal/nexus/meets/process", { method: "POST", body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMinutesError(data.error ?? "No se pudo procesar la grabación.");
                return;
            }
            setRecordingSummary(typeof data.summary === "string" ? data.summary : null);
            await loadMinutes();
        } catch {
            setMinutesError("Error de red al procesar la grabación.");
        } finally {
            setProcessingRecording(false);
        }
    }, [meetingId, loadMinutes]);

    useEffect(() => {
        if (showMinutes && isHost && !minutesLoaded) void loadMinutes();
    }, [showMinutes, isHost, minutesLoaded, loadMinutes]);

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
                    dealPublicId: deckState.dealPublicId ?? null,
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
            role="region"
            aria-label="Sala de videollamada soberana"
        >
            {frameError && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/95 text-white p-6 text-center">
                    <p className="text-sm text-zinc-300 max-w-sm">{frameError}</p>
                    <button
                        type="button"
                        onClick={() => {
                            setFrameError(null);
                            setLoading(true);
                            setRetryKey((key) => key + 1);
                        }}
                        className="mt-5 px-4 py-2 rounded-lg border border-lime-500/30 bg-lime-500/10 hover:bg-lime-500/20 text-lime-200 text-xs font-mono"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {loading && !frameError && (
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
            {isHost && !loading && !frameError && (
                <div className="absolute top-4 left-4 z-30 flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center gap-2 rounded-2xl bg-black/45 p-1.5 backdrop-blur-sm">
                    {hasDeck && presentation && (
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
                            {(!isMobile || showMore) && (
                        <>
<button
                                type="button"
                                onClick={() => {
                                    setShowMinutes((v) => !v);
                                    setShowScript(false);
                                    setShowNotes(false);
                                }}
                                className={`px-3 py-2 rounded-full text-xs font-mono flex items-center gap-1.5 border backdrop-blur transition-colors ${
                                    showMinutes
                                        ? "bg-emerald-500/30 border-emerald-400/50 text-emerald-100"
                                        : "bg-black/60 border-white/15 text-zinc-300 hover:text-white"
                                }`}
                                title="Minuta y grabación (solo host)"
                            >
                                <ClipboardList className="w-3.5 h-3.5" />
                                Minuta
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNotes((v) => !v);
                                    setShowScript(false);
                                    setShowMinutes(false);
                                }}
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
                                    onClick={() => {
                                        setShowScript((v) => !v);
                                        setShowNotes(false);
                                        setShowMinutes(false);
                                    }}
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
                        onClick={async () => {
                            try {
                                // Se copia la liga GENÉRICA de la sala, nunca la del host
                                // (que incluye su joinRef personal).
                                const shareUrl = `${window.location.origin}${shortMeetingPath(meetingId)}`;
                                const outcome = await shareOrCopyMeeting({
                                    title: deckMeta?.title ?? meetingTitle ?? "Pandora's · Sovereign Meet",
                                    startsAt: scheduledFor ?? null,
                                    endsAt: null,
                                    url: shareUrl,
                                });
                                if (outcome === "failed") return;
                                setLinkCopied(true);
                                setTimeout(() => setLinkCopied(false), 2000);
                            } catch {
                                /* el portapapeles requiere contexto seguro; sin acción */
                            }
                        }}
                        className="bg-black/60 hover:bg-black/80 text-zinc-200 px-3 py-2 rounded-full text-xs font-mono flex items-center gap-1.5 border border-white/15 backdrop-blur"
                        title="Copiar enlace genérico de la sala"
                    >
                        {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                        {linkCopied ? "Copiada" : "Liga"}
                    </button>
                                            </>)}
                    {isMobile && (
                        <button
                            type="button"
                            onClick={() => setShowMore((v) => !v)}
                            className={`w-9 h-9 rounded-full text-sm border backdrop-blur transition-colors ${
                                showMore
                                    ? "bg-white/15 border-white/30 text-white"
                                    : "bg-black/60 border-white/15 text-zinc-300 hover:text-white"
                            }`}
                            title="Más controles"
                            aria-label="Más controles"
                        >
                            {showMore ? "×" : "⋯"}
                        </button>
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
                <div className="absolute bottom-24 left-4 z-30 max-w-[min(20rem,calc(100vw-2rem))] text-[11px] text-red-300 bg-red-950/80 border border-red-500/40 rounded-lg px-3 py-2">
                    {deckError}
                </div>
            )}

            {/* Presenter script (host only) */}
            {isHost && showScript && presentation && (
                <aside className="absolute top-28 right-3 z-30 w-[min(20rem,calc(100vw-1.5rem))] max-h-[70dvh] overflow-y-auto rounded-xl bg-black/85 border border-purple-500/30 backdrop-blur p-4 space-y-3 sm:top-20">
                    <header className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-purple-300">Guión · {deckTitle}</p>
                            <p className="text-[10px] text-zinc-500">
                                {(deckMeta?.targetMinutes ?? catalogPresentation?.targetMinutes ?? 30)} min objetivo
                            </p>
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
                                {currentBlock.notes.map((beat, index) => (
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

                    {catalogPresentation?.proposalHref && (
                        <a
                            href={
                                deckState.dealPublicId
                                    ? `${catalogPresentation.proposalHref}?deal=${encodeURIComponent(deckState.dealPublicId)}`
                                    : catalogPresentation.proposalHref
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-mono text-emerald-200"
                        >
                            Abrir propuesta del deal
                        </a>
                    )}

                    <div className="pt-2 border-t border-white/10 space-y-1">
                        <p className="text-[10px] font-mono uppercase text-zinc-500">Reglas</p>
                        {guardrails.map((rule, index) => (
                            <p key={index} className="text-[10px] text-zinc-400 leading-relaxed">— {rule}</p>
                        ))}
                    </div>
                </aside>
            )}

            {/* Contexto de la sesión (host-only, persistido por reunión) */}
            {isHost && showNotes && (
                <aside className="absolute top-28 right-3 z-30 w-[min(20rem,calc(100vw-1.5rem))] max-h-[70dvh] overflow-y-auto rounded-xl bg-black/85 border border-sky-500/30 backdrop-blur p-4 space-y-3 sm:top-20">
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

            {/* Minuta de la sesión (host): tareas + grabación a resumen */}
            {isHost && showMinutes && (
                <aside className="absolute top-28 right-3 z-30 w-[min(22rem,calc(100vw-1.5rem))] max-h-[70dvh] overflow-y-auto rounded-xl bg-black/85 border border-emerald-500/30 backdrop-blur p-4 space-y-3 sm:top-20">
                    <header className="flex items-center justify-between">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">Minuta de la sesión</p>
                        <button type="button" onClick={() => setShowMinutes(false)} className="text-zinc-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </header>

                    {minutesLoading && <p className="text-[11px] text-zinc-500 font-mono">Cargando…</p>}

                    {minutesItems.length > 0 ? (
                        <ul className="space-y-1.5">
                            {minutesItems.map((item) => (
                                <li key={item.id} className="text-[11px] text-zinc-300 leading-relaxed flex gap-2">
                                    <span className="text-emerald-400">·</span>
                                    <span>
                                        {item.task}
                                        {item.assigneeName ? (
                                            <span className="text-zinc-500"> — {item.assigneeName}</span>
                                        ) : null}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !minutesLoading && <p className="text-[11px] text-zinc-500">Aún no hay acuerdos anotados.</p>
                    )}

                    <form onSubmit={addActionItem} className="space-y-2 pt-2 border-t border-white/10">
                        <input
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Acuerdo o tarea…"
                            className="w-full rounded-lg bg-black/60 border border-white/10 px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                        />
                        <div className="flex gap-2">
                            <input
                                value={newAssignee}
                                onChange={(e) => setNewAssignee(e.target.value)}
                                placeholder="Responsable (opcional)"
                                className="flex-1 rounded-lg bg-black/60 border border-white/10 px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                            />
                            <button
                                type="submit"
                                disabled={savingTask || newTask.trim().length < 3}
                                className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-50 text-emerald-100 text-[11px] font-mono"
                            >
                                {savingTask ? "..." : "Añadir"}
                            </button>
                        </div>
                    </form>

                    <div className="pt-3 border-t border-white/10 space-y-2">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Grabación → resumen</p>
                        <label className="block">
                            <input
                                type="file"
                                accept="audio/*,video/*"
                                disabled={processingRecording}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) void processRecording(file);
                                    event.target.value = "";
                                }}
                                className="block w-full text-[10px] text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-zinc-200"
                            />
                        </label>
                        <p className="text-[10px] text-zinc-500">
                            {processingRecording
                                ? "Procesando con Gemini… (puede tardar)"
                                : "Sube el audio o video de la sesión; se extraen resumen y tareas."}
                        </p>
                        {recordingSummary && (
                            <p className="text-[11px] text-zinc-300 leading-relaxed">{recordingSummary}</p>
                        )}
                    </div>

                    {minutesError && <p className="text-[11px] text-rose-300">{minutesError}</p>}
                </aside>
            )}

            {/* Injected deck: same slide for everyone, controlled by the host */}
            {deckState.open && presentation && (
                <div className={`absolute inset-x-0 bottom-0 z-20 bg-black flex flex-col ${isHost ? "top-24 sm:top-20" : "top-0"}`}>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/80">
                        <span className="min-w-0 truncate text-[10px] font-mono uppercase tracking-widest text-lime-400">
                            Presentación soberana · {deckTitle}
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
                        src={`${catalogPresentation?.href ?? `/pitch/deck/${presentationId}`}?embed=1&slide=${deckState.slide}`}
                        title={deckTitle}
                        className="flex-1 w-full border-0 bg-black"
                        allow="fullscreen"
                    />
                </div>
            )}

            {!isHost && hostPresent === false && !deckState.open && !meetingEnded && !loading && (
                <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 max-w-[calc(100vw-2rem)] rounded-full border border-amber-500/30 bg-amber-950/80 px-4 py-2 text-[11px] font-mono text-amber-200 backdrop-blur">
                    Esperando al anfitrión… puedes entrar y esperar.
                </div>
            )}

            {(meetingEnded || exitState) && (
                <MeetClosedScreen
                    reason={meetingEnded ? "ended" : exitState === "ended" ? "ended" : "left"}
                    isHost={isHost}
                    title={meetingTitle ?? deckTitle}
                    scheduledFor={scheduledFor ?? null}
                    canRejoin={!meetingEnded && exitState === "left"}
                    onRejoin={() => {
                        if (typeof window !== "undefined") window.location.reload();
                    }}
                />
            )}

            <div
                className="flex-1 w-full relative"
                style={(meetingEnded || exitState) ? { display: "none" } : undefined}
            >
                <JitsiMeeting
                    key={retryKey}
                    domain="8x8.vc"
                    roomName={fullRoomName}
                    jwt={jwt}
                    configOverwrite={{
                        defaultLanguage: "es",
                        // Título visible de la sesión (el deck o el nombre del producto).
                        subject: deckTitle && deckTitle !== "Presentación" ? deckTitle : "Sovereign Meet",
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
                        externalApiRef.current = externalApi as unknown as { executeCommand?: (command: string) => void };
                        setLoading(false);
                        setFrameError(null);
                        applyIframePermissions();

                        externalApi.on("videoConferenceJoined", () => {
                            console.log("[Sovereign Meet] Joined room.");
                        });

                        externalApi.on("readyToClose", () => {
                            // Host closing the call ends the meeting (queues follow-up),
                            // pero NO se redirige a Nexus: se muestra la pantalla de cierre.
                            if (isHost && !meetingEndedRef.current) {
                                void endMeeting();
                                setExitState("ended");
                                return;
                            }
                            setExitState(isHost ? "ended" : "left");
                        });
                    }}
                    getIFrameRef={(iframeRef) => {
                        // El SDK entrega el CONTENEDOR, no el iframe. Se reintenta unos
                        // segundos por si el iframe se monta después.
                        if (!applyIframePermissions()) {
                            let tries = 0;
                            const timer = setInterval(() => {
                                tries += 1;
                                if (applyIframePermissions() || tries >= 15) clearInterval(timer);
                            }, 200);
                        }
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
