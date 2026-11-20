"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Loader2, MonitorPlay, PhoneOff, X, BookOpen, NotebookPen, Save, Link2, Check, ClipboardList, PanelLeftClose, PanelLeftOpen, MicOff, Mic } from "lucide-react";
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
    /** Ref firmado de la sala: permite operar al host aunque no tenga sesión Nexus. */
    joinRef: string;
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
    meetingTitle,
    joinRef
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
    const [dockOpen, setDockOpen] = useState(true);
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
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [sendFollowUpOnEnd, setSendFollowUpOnEnd] = useState(true);
    const [sendingSummary, setSendingSummary] = useState(false);
    const [summarySendMessage, setSummarySendMessage] = useState<string | null>(null);
    // null = desconocido (no se muestra aviso). Solo aplica a invitados.
    const [hostPresent, setHostPresent] = useState<boolean | null>(null);
    // Grabación de la reunión (host): captura audio de la pestaña + micrófono.
    const [recording, setRecording] = useState(false);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [recordingError, setRecordingError] = useState<string | null>(null);
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const recordChunksRef = useRef<Blob[]>([]);
    const recordStreamsRef = useRef<MediaStream[]>([]);
    const recordAudioCtxRef = useRef<AudioContext | null>(null);
    const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const maxSlideIndex = Math.max(scriptBlocks.length - 1, 0);
    // Un estado viejo pudo quedar fuera de rango; nunca mostrar/pedir un slide inexistente.
    const safeSlide = Math.min(deckState.slide, maxSlideIndex);
    const currentBlock = scriptBlocks[safeSlide];

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
                    body: JSON.stringify({ meetingId, event, ref: joinRef }),
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
                const payload = JSON.stringify({ meetingId, event: "leave", ref: joinRef });
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
    }, [meetingId, joinRef]);

    // Push the synchronized slide index into the deck iframe.
    useEffect(() => {
        if (!deckState.open) return;
        const frame = deckFrameRef.current;
        if (!frame?.contentWindow) return;
        frame.contentWindow.postMessage({ type: "pandora:presentation:go", index: safeSlide }, "*");
    }, [deckState.open, safeSlide]);

    // Guión contextual de ESTA sesión (host-only): se carga al abrir el panel.
    const loadNotes = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/v1/meet/notes?meetingId=${encodeURIComponent(meetingId)}&ref=${encodeURIComponent(joinRef)}`,
                { cache: "no-store" }
            );
            if (!res.ok) return;
            const data = await res.json();
            setNotes(data.notes ?? "");
            setNotesLoaded(true);
        } catch {
            setNotesLoaded(true);
        }
    }, [meetingId, joinRef]);

    const saveNotes = useCallback(async () => {
        setNotesSaving(true);
        setNotesSaved(false);
        try {
            const res = await fetch("/api/v1/meet/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingId, notes, ref: joinRef }),
            });
            if (res.ok) setNotesSaved(true);
        } catch {
            // sin éxito visible: el host ve que no se guardó
        } finally {
            setNotesSaving(false);
        }
    }, [meetingId, notes, joinRef]);

    useEffect(() => {
        if (showNotes && isHost && !notesLoaded) void loadNotes();
    }, [showNotes, isHost, notesLoaded, loadNotes]);

    const loadMinutes = useCallback(async () => {
        setMinutesLoading(true);
        setMinutesError(null);
        try {
            const res = await fetch(
                `/api/v1/meet/action-items?meetingId=${encodeURIComponent(meetingId)}&ref=${encodeURIComponent(joinRef)}`,
                { cache: "no-store" }
            );
            if (!res.ok) {
                setMinutesError("No se pudo cargar la minuta.");
                return;
            }
            const data = await res.json();
            setMinutesItems(Array.isArray(data.items) ? data.items : []);
            if (typeof data.summary === "string") {
                setRecordingSummary(data.summary.trim() || null);
            }
        } catch {
            setMinutesError("Error de red al cargar la minuta.");
        } finally {
            setMinutesLoading(false);
            setMinutesLoaded(true);
        }
    }, [meetingId, joinRef]);

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
                    ref: joinRef,
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
    }, [meetingId, newTask, newAssignee, joinRef]);

    const processRecording = useCallback(async (file: File) => {
        setMinutesError(null);
        if (!file.type.startsWith("audio/")) {
            setMinutesError("Solo se aceptan archivos de audio (MP3, M4A, WAV, OGG, WebM).");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setMinutesError("El audio es demasiado grande (máx. 10 MB ≈ 40 min a 32 kbps).");
            return;
        }

        setProcessingRecording(true);
        setRecordingSummary(null);
        try {
            const form = new FormData();
            form.append("meetingId", meetingId);
            form.append("ref", joinRef);
            form.append("file", file);
            const res = await fetch("/api/v1/internal/nexus/meets/process", { method: "POST", body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMinutesError(
                    data.code === "AI_NOT_CONFIGURED"
                        ? "La IA no está configurada en producción. Falta GEMINI_API_KEY."
                        : data.error ?? "No se pudo procesar la grabación."
                );
                return;
            }
            if (typeof data.summary !== "string" || !data.summary.trim()) {
                setMinutesError("El modelo no devolvió un resumen. Intenta con otro audio.");
                return;
            }
            setRecordingSummary(data.summary);
            if (data.tasksSynced === false) {
                setMinutesError("Resumen guardado, pero no se pudieron guardar las tareas.");
            }
            await loadMinutes();
        } catch {
            setMinutesError("Error de red al procesar la grabación.");
        } finally {
            setProcessingRecording(false);
        }
    }, [meetingId, joinRef, loadMinutes]);

    useEffect(() => {
        if (showMinutes && isHost && !minutesLoaded) void loadMinutes();
    }, [showMinutes, isHost, minutesLoaded, loadMinutes]);

    // --- Grabación de la reunión (solo host) ---
    // Jitsi vive en un iframe cross-origin: la única forma de capturar también la
    // voz de los invitados es compartir la pestaña CON audio (getDisplayMedia).
    // Es un gesto explícito: el navegador no permite iniciar esto solo.
    const cleanupRecording = useCallback(() => {
        recordStreamsRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
        recordStreamsRef.current = [];
        if (recordAudioCtxRef.current) {
            void recordAudioCtxRef.current.close().catch(() => undefined);
            recordAudioCtxRef.current = null;
        }
        if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }
        recorderRef.current = null;
        setRecording(false);
        setRecordSeconds(0);
    }, []);

    const startRecording = useCallback(async () => {
        if (!isHost || recorderRef.current) return;
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
            setRecordingError("Tu navegador no permite grabar la reunión desde aquí.");
            return;
        }
        setRecordingError(null);
        try {
            const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            if (display.getAudioTracks().length === 0) {
                display.getTracks().forEach((track) => track.stop());
                setRecordingError(
                    "No compartiste el audio. Elige la pestaña de la reunión y activa \u201cCompartir audio de la pestaña\u201d."
                );
                return;
            }
            display.getVideoTracks().forEach((track) => track.stop());

            let mic: MediaStream | null = null;
            try {
                mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch {
                mic = null; // sin micrófono: se graba solo el audio de la pestaña
            }

            const AudioCtx = window.AudioContext;
            const ctx = new AudioCtx();
            const destination = ctx.createMediaStreamDestination();
            [display, mic].forEach((stream) => {
                if (!stream) return;
                stream.getAudioTracks().forEach((track) => {
                    ctx.createMediaStreamSource(new MediaStream([track])).connect(destination);
                });
            });

            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : "audio/webm";
            const recorder = new MediaRecorder(destination.stream, {
                mimeType,
                audioBitsPerSecond: 24000,
            });
            recordChunksRef.current = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordChunksRef.current.push(event.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(recordChunksRef.current, { type: mimeType });
                recordChunksRef.current = [];
                cleanupRecording();
                if (blob.size === 0) {
                    setRecordingError("La grabación quedó vacía. Intenta de nuevo.");
                    return;
                }
                if (blob.size > 10 * 1024 * 1024) {
                    setRecordingError(
                        `La grabación pesa ${(blob.size / 1024 / 1024).toFixed(1)} MB (máx. 10 MB). Súbela manualmente en Minuta.`
                    );
                    return;
                }
                setRecordingUrl((previous) => {
                    if (previous) URL.revokeObjectURL(previous);
                    return URL.createObjectURL(blob);
                });
                const file = new File([blob], `reunion-${meetingId}.webm`, { type: mimeType });
                void processRecording(file);
            };
            display.getAudioTracks()[0]?.addEventListener("ended", () => {
                if (recorder.state !== "inactive") recorder.stop();
            });

            recordStreamsRef.current = mic ? [display, mic] : [display];
            recordAudioCtxRef.current = ctx;
            recorderRef.current = recorder;
            recorder.start(5000);
            setRecording(true);
            setRecordSeconds(0);
            recordTimerRef.current = setInterval(() => setRecordSeconds((value) => value + 1), 1000);
        } catch (error) {
            const name = (error as { name?: string } | null)?.name;
            setRecordingError(
                name === "NotAllowedError" ? "Cancelaste el permiso de grabación." : "No se pudo iniciar la grabación."
            );
        }
    }, [cleanupRecording, isHost, meetingId, processRecording]);

    const stopRecording = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
            return;
        }
        cleanupRecording();
    }, [cleanupRecording]);

    // Al salir de la sala sin finalizar, se libera el micrófono y la captura.
    useEffect(() => () => {
        recordStreamsRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }, []);

    const updateDeck = useCallback(
        async (patch: { open?: boolean; slide?: number }) => {
            setDeckBusy(true);
            setDeckError(null);
            try {
                const res = await fetch("/api/v1/meet/presentation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meetingId, ref: joinRef, ...patch }),
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
        [deckState.status, joinRef]
    );

    const endMeeting = useCallback(async (options?: { sendFollowUp?: boolean }) => {
        const sendFollowUp = options?.sendFollowUp !== false;
        setEnding(true);
        try {
            const res = await fetch("/api/v1/meet/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingId, ref: joinRef, sendFollowUp }),
            });
            if (res.ok) {
                setMeetingEnded(true);
                // Detiene la grabación: `onstop` arma el archivo y lo sube para el resumen.
                stopRecording();
                return true;
            }
            return false;
        } catch {
            return false;
        } finally {
            setEnding(false);
        }
    }, [meetingId, joinRef, stopRecording]);

    // Envío manual del seguimiento (host). No depende del correo de cortesía.
    const sendSummary = useCallback(
        async (options?: {
            message?: string;
            includeDeck?: boolean;
            includeProposal?: boolean;
            includeTasks?: boolean;
            extraEmails?: string[];
        }) => {
            setSendingSummary(true);
            setSummarySendMessage(null);
            try {
                const res = await fetch("/api/v1/meet/follow-up", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meetingId, ref: joinRef, ...options }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setSummarySendMessage(
                        data.code === "MEETING_NOT_ENDED"
                            ? "Finaliza la reunión para enviar el seguimiento."
                            : data.error ?? "No se pudo enviar el seguimiento."
                    );
                    return;
                }
                const total = (data.sent ?? 0) + (data.extras ?? 0);
                setSummarySendMessage(
                    total > 0
                        ? `Enviado a ${total} destinatario${total === 1 ? "" : "s"}.`
                        : data.skipped > 0
                          ? "Ya se había enviado a esos destinatarios."
                          : "No hay participantes con email para enviar."
                );
            } catch {
                setSummarySendMessage("Error de red al enviar el seguimiento.");
            } finally {
                setSendingSummary(false);
            }
        },
        [meetingId, joinRef]
    );

    const toolbarButtons = isMobile
        ? isHost
            ? [...new Set([...MOBILE_TOOLBAR, 'mute-everyone'])]
            : MOBILE_TOOLBAR
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

            {/* Host dock vertical: no cubre la parte superior del deck */}
            {isHost && !loading && !frameError && (
                <div className="absolute left-2 top-1/2 z-30 -translate-y-1/2 sm:left-3">
                    {dockOpen ? (
                        <div className="flex max-h-[82vh] w-[3.6rem] flex-col items-stretch gap-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-black/55 p-1.5 shadow-2xl backdrop-blur-md">
                            <div className="flex w-full items-center justify-between px-1">
                                <span className="hidden text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 sm:inline">
                                    Host
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setDockOpen(false)}
                                    className="text-zinc-500 hover:text-white"
                                    title="Ocultar controles"
                                    aria-label="Ocultar controles"
                                >
                                    <PanelLeftClose className="h-4 w-4" />
                                </button>
                            </div>

                            {hasDeck && presentation && (
                                <>
                                    <button
                                        type="button"
                                        disabled={deckBusy || meetingEnded}
                                        onClick={() => updateDeck({ open: !deckState.open, slide: safeSlide })}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-lime-400/50 bg-lime-500 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-lime-400 disabled:opacity-50 justify-center px-2"
                                        title={deckState.open ? "Ocultar deck para todos" : "Presentar deck para todos"}
                                    >
                                        <MonitorPlay className="h-4 w-4 shrink-0" />
                                        <span className="hidden">
                                            {deckState.open ? "Ocultar deck" : "Presentar deck"}
                                        </span>
                                    </button>

                                    {deckState.open && (
                                        <div className="flex w-full flex-col items-center gap-1 rounded-lg border border-white/10 bg-black/50 p-1">
                                            <button
                                                type="button"
                                                disabled={deckBusy || safeSlide === 0}
                                                onClick={() => updateDeck({ slide: Math.max(safeSlide - 1, 0) })}
                                                className="rounded-md p-1.5 text-white hover:bg-white/10 disabled:opacity-40"
                                                title="Slide anterior"
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </button>
                                            <span className="min-w-[2.5rem] text-center text-[9px] font-mono text-zinc-300">
                                                {safeSlide + 1}/{scriptBlocks.length || "?"}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={deckBusy || safeSlide >= maxSlideIndex}
                                                onClick={() => updateDeck({ slide: Math.min(safeSlide + 1, maxSlideIndex) })}
                                                className="rounded-md p-1.5 text-white hover:bg-white/10 disabled:opacity-40"
                                                title="Slide siguiente"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {isHost && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (recording) {
                                            stopRecording();
                                        } else {
                                            void startRecording();
                                        }
                                    }}
                                    className={`flex w-full items-center justify-center gap-2 rounded-lg border px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors justify-center px-2 ${
                                        recording
                                            ? "border-red-400/60 bg-red-500/30 text-red-100"
                                            : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white"
                                    }`}
                                    title={
                                        recording
                                            ? "Detener grabación. El audio se sube solo para generar el resumen."
                                            : "Grabar la reunión (comparte la pestaña con audio) para la minuta"
                                    }
                                >
                                    <Mic className="h-3.5 w-3.5 shrink-0" />
                                    {recording ? (
                                        <span className="text-[9px] tabular-nums">
                                            {Math.floor(recordSeconds / 60)}:
                                            {String(recordSeconds % 60).padStart(2, "0")}
                                        </span>
                                    ) : (
                                        <span className="hidden">Grabar</span>
                                    )}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setShowMinutes((v) => !v);
                                    setShowScript(false);
                                    setShowNotes(false);
                                }}
                                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors justify-center px-2 ${
                                    showMinutes
                                        ? "border-emerald-400/50 bg-emerald-500/30 text-emerald-100"
                                        : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white"
                                }`}
                                title="Minuta y grabación (solo host)"
                            >
                                <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden">Minuta</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowNotes((v) => !v);
                                    setShowScript(false);
                                    setShowMinutes(false);
                                }}
                                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors justify-center px-2 ${
                                    showNotes
                                        ? "border-sky-400/50 bg-sky-500/30 text-sky-100"
                                        : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white"
                                }`}
                                title="Contexto de la sesión (solo host)"
                            >
                                <NotebookPen className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden">Contexto</span>
                            </button>

                            {presentation && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowScript((v) => !v);
                                        setShowNotes(false);
                                        setShowMinutes(false);
                                    }}
                                    className={`flex w-full items-center justify-center gap-2 rounded-lg border px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors justify-center px-2 ${
                                        showScript
                                            ? "border-purple-400/50 bg-purple-500/30 text-purple-100"
                                            : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white"
                                    }`}
                                    title="Guión del presentador"
                                >
                                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                    <span className="hidden">Guión</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={async () => {
                                    try {
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
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:bg-white/10 hover:text-white justify-center px-2"
                                title="Copiar enlace genérico de la sala"
                            >
                                {linkCopied ? (
                                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <Link2 className="h-4 w-4 shrink-0" />
                                )}
                                <span className="hidden">{linkCopied ? "Copiada" : "Liga"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    const api = externalApiRef.current;
                                    try {
                                        api?.executeCommand?.("muteEveryone");
                                    } catch {
                                        try {
                                            api?.executeCommand?.("mute-everyone");
                                        } catch {
                                            /* si el SDK no expone el comando, se usa el toolbar nativo */
                                        }
                                    }
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-200 transition-colors hover:bg-amber-500/20 justify-center px-2"
                                title="Silenciar a todos. Para bloquear el auto-desmuteo, usa el diálogo nativo de Jitsi (Mute everyone → desmarcar 'Permitir que se desmuteen')."
                            >
                                <MicOff className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden">Silenciar</span>
                            </button>

                            <div className="mt-1 border-t border-white/10 pt-1.5">
                                <button
                                    type="button"
                                    disabled={ending || meetingEnded}
                                    onClick={() => setShowEndConfirm(true)}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600/90 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-500 disabled:opacity-50 justify-center px-2"
                                    title="Finaliza la reunión y encola el seguimiento por email"
                                >
                                    <PhoneOff className="h-4 w-4 shrink-0" />
                                    <span className="hidden">
                                        {meetingEnded ? "Finalizada" : ending ? "Finalizando..." : "Finalizar"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setDockOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-zinc-300 shadow-xl backdrop-blur-md transition-colors hover:text-white"
                            title="Mostrar controles"
                            aria-label="Mostrar controles"
                        >
                            <PanelLeftOpen className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {isHost && deckError && (
                <div className="absolute bottom-4 left-20 z-30 max-w-[min(20rem,calc(100vw-6rem))] sm:left-60 text-[11px] text-red-300 bg-red-950/80 border border-red-500/40 rounded-lg px-3 py-2">
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
                                {safeSlide + 1}. {currentBlock.title}
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
                                accept="audio/*"
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
                                : "Sube solo el audio de la sesión (máx. 10 MB ≈ 40 min a 32 kbps). Se extraen resumen y tareas; las tareas manuales se conservan. Requiere sesión de Nexus o enlace de host."}
                        </p>
                        {recordingSummary && (
                            <p className="text-[11px] text-zinc-300 leading-relaxed">{recordingSummary}</p>
                        )}
                    </div>

                    {minutesError && <p className="text-[11px] text-rose-300">{minutesError}</p>}

                    <div className="pt-3 border-t border-white/10 space-y-2">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                            Seguimiento
                        </p>
                        <button
                            type="button"
                            onClick={() => void sendSummary()}
                            disabled={sendingSummary || !meetingEnded}
                            className="w-full rounded-lg border border-lime-500/30 bg-lime-500/10 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-lime-200 hover:bg-lime-500/20 disabled:opacity-50"
                        >
                            {sendingSummary ? "Enviando…" : "Enviar seguimiento a participantes"}
                        </button>
                        <p className="text-[10px] leading-relaxed text-zinc-500">
                            {recordingSummary
                                ? "Incluye resumen y tareas. Se envía solo a quienes asistieron y aún no lo hayan recibido."
                                : "Sube el audio de la sesión para generar el resumen. Sin resumen no hay correo que enviar."}
                        </p>
                        {summarySendMessage && (
                            <p className="text-[10px] text-zinc-300">{summarySendMessage}</p>
                        )}
                    </div>
                </aside>
            )}

            {/* Injected deck: same slide for everyone, controlled by the host */}
            {deckState.open && presentation && (
                <div className="absolute inset-x-0 bottom-0 top-0 z-20 bg-black flex flex-col">
                    <div className={`flex items-center justify-between py-2 border-b border-white/10 bg-black/80 ${isHost ? "pl-16 pr-4" : "px-4"}`}>
                        <span className="min-w-0 truncate text-[10px] font-mono uppercase tracking-widest text-lime-400">
                            Presentación soberana · {deckTitle}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500">
                                Slide {safeSlide + 1}
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
                        src={`${catalogPresentation?.href ?? `/pitch/deck/${presentationId}`}?embed=1&slide=${safeSlide}`}
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

            {(recording || recordingError) && (
                <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2">
                    <div
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest backdrop-blur ${
                            recording
                                ? "border-red-400/40 bg-red-500/20 text-red-100"
                                : "border-amber-400/40 bg-amber-500/20 text-amber-100"
                        }`}
                    >
                        {recording && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />}
                        {recording
                            ? `Grabando ${Math.floor(recordSeconds / 60)}:${String(recordSeconds % 60).padStart(2, "0")}`
                            : recordingError}
                    </div>
                </div>
            )}

            {showEndConfirm && !meetingEnded && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-300/80">
                                    Cerrar sesión
                                </p>
                                <h2 className="mt-2 text-lg font-semibold text-white">¿Finalizar la reunión?</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEndConfirm(false)}
                                className="text-zinc-500 hover:text-white"
                                aria-label="Cancelar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                            Se cerrará para todos los participantes. Después verás la pantalla de
                            cierre, donde puedes escribir el mensaje, elegir si incluyes
                            presentación, propuesta y tareas, y agregar correos adicionales antes de
                            enviar el seguimiento.
                        </p>

                        <label className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-zinc-300">
                            <input
                                type="checkbox"
                                checked={sendFollowUpOnEnd}
                                onChange={(event) => setSendFollowUpOnEnd(event.target.checked)}
                                className="mt-0.5 h-3.5 w-3.5 accent-lime-500"
                            />
                            <span>
                                Enviar correo de seguimiento a los participantes al cerrar.
                                <span className="mt-0.5 block text-[10px] text-zinc-500">
                                    Si lo desactivas, no se envía nada ahora. Podrás enviar el resumen después.
                                </span>
                            </span>
                        </label>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowEndConfirm(false)}
                                className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEndConfirm(false);
                                    void endMeeting({ sendFollowUp: sendFollowUpOnEnd });
                                }}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-wider text-white hover:bg-red-500"
                            >
                                <PhoneOff className="h-3.5 w-3.5" />
                                Finalizar
                            </button>
                        </div>
                    </div>
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
                    onSendSummary={sendSummary}
                    sendingSummary={sendingSummary}
                    summaryMessage={summarySendMessage}
                    hasSummary={Boolean(recordingSummary)}
                    recordingUrl={recordingUrl}
                    showInternalLinks={isHost}
                    onProcessAudio={processRecording}
                    processingAudio={processingRecording}
                    audioMessage={minutesError}
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
                        toolbarConfig: {
                            alwaysVisible: true,
                        },
                        toolbarButtons,
                    }}
                    interfaceConfigOverwrite={{
                        // Legacy flags — still honored by some JaaS deployments.
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        // Controles básicos siempre visibles, también en móvil: en la
                        // práctica se necesitan (micrófono, cámara, chat, salir).
                        TOOLBAR_ALWAYS_VISIBLE: true,
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
                                // Cerrar desde Jitsi no envía correo por sorpresa:
                                // el host puede enviarlo desde la pantalla de cierre.
                                void endMeeting({ sendFollowUp: false });
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
