"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Copy, Loader2, AlertTriangle, X } from "lucide-react";
import { NEXUS_PRESENTATIONS } from "@/lib/nexus/presentations-catalog";
import { shortMeetingPath, shareOrCopyMeeting } from "@/lib/meet/meeting-links";

interface CreateResult {
  meetingId: string;
  joinUrl: string;
  scheduledFor: string;
  endsAt: string | null;
  presentationId: string | null;
  title: string | null;
  invites: { sent: number; failed: number; errors: string[] };
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Tu sesión expiró. Vuelve a iniciar sesión en Nexus.",
  MISSING_CALENDAR_MANAGE: "Tu identidad no tiene la capability calendar.manage.",
  HOST_COLLABORATOR_UNRESOLVED: "Tu usuario no está vinculado a un colaborador de Nexus.",
  INVALID_SCHEDULED_FOR: "La fecha no es válida.",
  SCHEDULED_FOR_IN_PAST: "La fecha ya pasó.",
  INVALID_DURATION: "La duración debe estar entre 15 y 240 minutos.",
  INVALID_PRESENTATION_ID: "Ese deck no existe en el catálogo.",
  TITLE_REQUIRED: "Escribe un asunto para la reunión externa.",
  TITLE_TOO_LONG: "El asunto es demasiado largo (máx. 160 caracteres).",
  INVALID_PARTICIPANT_EMAIL: "Hay emails inválidos en la lista.",
  TOO_MANY_PARTICIPANTS: "Máximo 20 participantes.",
  MEETING_CREATION_FAILED: "No se pudo crear la reunión en el servidor.",
};

function defaultStart(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Camino 2 de agenda: reunión con deck desde la Agenda Soberana (sin Deal Room).
 * El camino 1 es Deal Room → Clients & CRM → "Agendar presentación".
 */
interface SchedulePresentationFormProps {
  /** Deck preseleccionado (p. ej. al llegar desde el guión: ?deck=celeste). */
  initialDeck?: string | null;
  /** Abre el formulario al montar (?schedule=1). */
  initialOpen?: boolean;
}

type SessionKind = "presentation" | "external";

export function SchedulePresentationForm({ initialDeck, initialOpen = false }: SchedulePresentationFormProps = {}) {
  const router = useRouter();
  const defaultDeck = initialDeck ?? "celeste";
  const [open, setOpen] = useState(initialOpen);
  const [kind, setKind] = useState<SessionKind>("presentation");
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState(defaultStart());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [presentationId, setPresentationId] = useState(defaultDeck);
  const [participants, setParticipants] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setOpen(false);
    setResult(null);
    setError(null);
    setParticipants("");
    setScheduledFor(defaultStart());
    setDurationMinutes(30);
    setPresentationId(defaultDeck);
    setTitle("");
    setCopied(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);

    const startsAt = new Date(scheduledFor);
    if (Number.isNaN(startsAt.getTime())) {
      setError(ERROR_MESSAGES.INVALID_SCHEDULED_FOR ?? "La fecha no es válida.");
      setPending(false);
      return;
    }

    if (kind === "external" && !title.trim()) {
      setError(ERROR_MESSAGES.TITLE_REQUIRED ?? "Escribe un asunto.");
      setPending(false);
      return;
    }

    const emails = participants
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/v1/nexus/agenda/meet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kind,
          scheduledFor: startsAt.toISOString(),
          durationMinutes,
          ...(kind === "presentation" && presentationId ? { presentationId } : {}),
          ...(kind === "external" ? { title: title.trim() } : {}),
          participants: emails,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message: string | undefined = ERROR_MESSAGES[data.code] ?? data.error;
        setError(message ?? "No se pudo crear la reunión.");
        return;
      }

      setResult({
        meetingId: data.meeting.id,
        joinUrl: data.meeting.joinUrl,
        scheduledFor: data.meeting.scheduledFor,
        endsAt: data.meeting.endsAt ?? null,
        presentationId: data.meeting.presentationId ?? null,
        title: data.meeting.title ?? null,
        invites: data.invites ?? { sent: 0, failed: 0, errors: [] },
      });
      router.refresh();
    } catch {
      setError("Error de red al agendar.");
    } finally {
      setPending(false);
    }
  };

  // Compartir como Zoom: título del deck + día/hora + enlace corto.
  const shareResult = async () => {
    if (!result) return;
    const deck = NEXUS_PRESENTATIONS.find((item) => item.slug === result.presentationId);
    const outcome = await shareOrCopyMeeting({
      title: result.title ?? deck?.title ?? "Pandora's · Sovereign Meet",
      startsAt: result.scheduledFor,
      endsAt: result.endsAt,
      url: `${window.location.origin}${shortMeetingPath(result.meetingId)}`,
    });
    if (outcome === "failed") return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => (open ? reset() : setOpen(true))}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-lime-500/40 bg-lime-500/10 hover:bg-lime-500/20 text-lime-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all"
      >
        <CalendarPlus size={16} />
        <span>Agendar sesión</span>
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="w-full max-w-md text-left rounded-xl border border-white/10 bg-[#0A0A0E] p-4 space-y-3"
        >
          {result ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-300">
                <Check className="w-4 h-4" /> Reunión agendada
              </p>
              <p className="text-[11px] text-zinc-300">
                {new Date(result.scheduledFor).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                {result.endsAt ? ` → ${new Date(result.endsAt).toLocaleTimeString("es-MX", { timeStyle: "short" })}` : ""}
              </p>
              <p className="text-[11px]">
                <span className="text-zinc-500">Invitaciones:</span>{" "}
                <span className={result.invites.failed > 0 ? "text-amber-300" : "text-emerald-300"}>
                  {result.invites.sent} enviadas{result.invites.failed > 0 ? ` · ${result.invites.failed} fallidas` : ""}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={shareResult}
                  className="px-3 py-1.5 rounded-lg border border-lime-500/30 bg-lime-500/10 hover:bg-lime-500/20 text-lime-200 text-[11px] font-mono flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Compartir invitación
                </button>
                <button type="button" onClick={reset} className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300">
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Nueva sesión</p>
                <button type="button" onClick={reset} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tipo de sesión: el deck es opcional; externa = sin deal ni deck. */}
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
                {(
                  [
                    { id: "presentation" as const, label: "Presentación" },
                    { id: "external" as const, label: "Externa" },
                  ]
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setKind(option.id);
                      setError(null);
                    }}
                    className={`rounded-md px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      kind === option.id
                        ? "bg-lime-500/15 text-lime-200 border border-lime-500/30"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {kind === "external" ? (
                <label className="block text-[11px] font-mono text-zinc-500 space-y-1">
                  <span>Asunto</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={160}
                    required
                    placeholder="Llamada con proveedor, revisión interna…"
                    className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-lime-500/50"
                  />
                  <span className="text-[10px] text-zinc-600">
                    Sin Deal Room ni deck. Se crea solo la sala y se invita por email.
                  </span>
                </label>
              ) : (
                <label className="block text-[11px] font-mono text-zinc-500 space-y-1">
                  <span>Deck</span>
                  <select
                    value={presentationId}
                    onChange={(e) => setPresentationId(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-lime-500/50"
                  >
                    {NEXUS_PRESENTATIONS.map((deck) => (
                      <option key={deck.slug} value={deck.slug}>{deck.title}</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] font-mono text-zinc-500 space-y-1">
                  <span>Inicio</span>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    required
                    className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-lime-500/50"
                  />
                </label>
                <label className="block text-[11px] font-mono text-zinc-500 space-y-1">
                  <span>Duración (min)</span>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-lime-500/50"
                  >
                    {[15, 30, 45, 60, 90, 120].map((minutes) => (
                      <option key={minutes} value={minutes}>{minutes}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-[11px] font-mono text-zinc-500 space-y-1">
                <span>Participantes (emails separados por coma)</span>
                <textarea
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  rows={3}
                  placeholder="eduardo@celeste.com, comercial@celeste.com"
                  className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-lime-500/50"
                />
              </label>

              {error && (
                <p className="flex items-start gap-2 text-[11px] text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full px-3 py-2 rounded-lg border border-lime-500/30 bg-lime-500/15 hover:bg-lime-500/25 disabled:opacity-50 text-lime-200 text-xs font-mono flex items-center justify-center gap-2"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                {pending ? "Agendando..." : kind === "external" ? "Crear reunión externa" : "Crear presentación"}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
