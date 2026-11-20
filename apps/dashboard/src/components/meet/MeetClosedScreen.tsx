"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays, RotateCcw, ShieldCheck, Video } from "lucide-react";
import { LobbyGlobe } from "./LobbyGlobe";

interface MeetClosedScreenProps {
  /** "ended" = se cerró para todos; "left" = el usuario salió y la sala sigue. */
  reason: "ended" | "left";
  isHost: boolean;
  title: string;
  scheduledFor?: string | null;
  /** Solo tiene sentido si la reunión sigue viva y el usuario salió. */
  canRejoin: boolean;
  onRejoin: () => void;
  /** Envío manual del seguimiento (resumen + tareas + material) — solo host. */
  onSendSummary?: (options: {
    message: string;
    includeDeck: boolean;
    includeProposal: boolean;
    includeTasks: boolean;
    includeRecap: boolean;
    extraEmails: string[];
  }) => void | Promise<void>;
  sendingSummary?: boolean;
  summaryMessage?: string | null;
  /** Si ya hay resumen IA: cambia el copy y oculta la subida de audio. */
  hasSummary?: boolean;
  /** Subir audio DESPUÉS de cerrar la sala (host). */
  onProcessAudio?: (file: File) => void | Promise<void>;
  /** URL local del audio grabado en esta sesión (para descargarlo). */
  recordingUrl?: string | null;
  /** Los enlaces internos (agenda/Nexus) son solo para colaboradores. */
  showInternalLinks?: boolean;
  processingAudio?: boolean;
  audioMessage?: string | null;
}

/**
 * Pantalla de cierre de Sovereign Meet.
 *
 * Sustituye el redirect seco a `/` (que dejaba al usuario en Nexus con todo
 * abierto). Mantiene la identidad del lobby y da contexto: qué sesión era,
 * cuándo fue, si terminó para todos o solo saliste, y a dónde seguir.
 */
export function MeetClosedScreen({
  reason,
  isHost,
  title,
  scheduledFor,
  canRejoin,
  onRejoin,
  onSendSummary,
  sendingSummary = false,
  summaryMessage = null,
  hasSummary = false,
  onProcessAudio,
  recordingUrl = null,
  showInternalLinks = true,
  processingAudio = false,
  audioMessage = null,
}: MeetClosedScreenProps) {
  const ended = reason === "ended";

  const [message, setMessage] = useState("");
  const [includeDeck, setIncludeDeck] = useState(true);
  const [includeProposal, setIncludeProposal] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeRecap, setIncludeRecap] = useState(true);
  const [extraEmailsText, setExtraEmailsText] = useState("");
  const [extraEmailsError, setExtraEmailsError] = useState<string | null>(null);

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSend = () => {
    if (!onSendSummary) return;
    const raw = extraEmailsText
      .split(/[,;\s]+/)
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
    const invalid = raw.filter((value) => !EMAIL_PATTERN.test(value));
    if (invalid.length > 0) {
      setExtraEmailsError(`Correo inválido: ${invalid[0]}`);
      return;
    }
    if (raw.length > 10) {
      setExtraEmailsError("Máximo 10 correos adicionales.");
      return;
    }
    setExtraEmailsError(null);
    void onSendSummary({
      message: message.trim(),
      includeDeck,
      includeProposal,
      includeTasks,
      includeRecap,
      extraEmails: Array.from(new Set(raw)),
    });
  };

  const when = scheduledFor
    ? new Date(scheduledFor).toLocaleString("es-MX", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      })
    : null;

  const headline = ended
    ? isHost
      ? "Finalizaste la reunión"
      : "La sesión terminó"
    : "Saliste de la sesión";

  const body = ended
    ? isHost
      ? "Se cerró para todos. Puedes enviar el resumen con tareas a los participantes cuando quieras."
      : "El anfitrión cerró la reunión para todos. Si hay resumen o tareas, quedarán en la agenda."
    : "Saliste de la reunión. Si el anfitrión la mantiene abierta, puedes volver a entrar.";

  return (
    <div className="absolute inset-0 z-50 flex min-h-[100dvh] w-full items-center justify-center overflow-y-auto bg-[#07070B] p-5 sm:p-8">
      <LobbyGlobe className="pointer-events-none absolute inset-0 h-full w-full opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07070B]/40 via-[#07070B]/70 to-[#07070B]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-lime-500/15 bg-zinc-950/90 p-6 shadow-[0_0_60px_rgba(132,204,22,0.06)] backdrop-blur sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-lime-400/80">
            Pandora&apos;s · Sovereign Meet
          </p>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider ${
              ended
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${ended ? "bg-rose-400" : "bg-amber-400"}`} />
            {ended ? "Finalizada" : "Saliste"}
          </span>
        </div>

        <h1 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight text-white">
          {headline}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>

        <div className="mt-5 space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-start gap-2.5">
            <Video className="mt-0.5 h-4 w-4 shrink-0 text-lime-400/80" />
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Sesión</p>
              <p className="truncate text-sm text-zinc-200">{title}</p>
            </div>
          </div>
          {when && (
            <div className="flex items-start gap-2.5 pt-1">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-purple-300/80" />
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Cuándo</p>
                <p className="text-sm capitalize text-zinc-200">{when}</p>
              </div>
            </div>
          )}
        </div>

        {ended && (
          <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-500/70" />
            El seguimiento (resumen, tareas y grabación) queda en la agenda de Nexus. No se
            envía nada a los invitados sin que el anfitrión lo decida.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {isHost && ended && onProcessAudio && !hasSummary && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Minuta
              </p>
              <label
                className={`mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-lime-500/30 bg-lime-500/10 px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider text-lime-200 transition-colors hover:bg-lime-500/20 ${
                  processingAudio ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <input
                  type="file"
                  accept="audio/*"
                  disabled={processingAudio}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onProcessAudio(file);
                    event.target.value = "";
                  }}
                  className="hidden"
                />
                {processingAudio ? "Procesando audio…" : "Subir audio y generar resumen"}
              </label>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
                MP3/M4A/WAV ≤ 10 MB. Se conservan las tareas manuales. Después podrás enviar el
                resumen.
              </p>
              {recordingUrl && (
                <a
                  href={recordingUrl}
                  download
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-200 transition-colors hover:bg-white/10"
                >
                  Descargar audio de la sesión
                </a>
              )}
              {audioMessage && (
                <p className="mt-1 text-[10px] leading-relaxed text-rose-300">{audioMessage}</p>
              )}
            </div>
          )}

          {isHost && ended && onSendSummary && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Seguimiento a participantes
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
                {hasSummary
                  ? "Se envía el resumen, las tareas y el material que marques."
                  : "Se envía el seguimiento y el material que marques. Sin resumen IA, el correo sale como seguimiento de la sesión."}
              </p>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, 2000))}
                rows={3}
                placeholder="Mensaje para los participantes (opcional)…"
                className="mt-3 w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-lime-500/40"
              />
              <p className="mt-1 text-right text-[9px] font-mono text-zinc-600">{message.length}/2000</p>

              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeDeck}
                    onChange={(event) => setIncludeDeck(event.target.checked)}
                    className="h-3.5 w-3.5 accent-lime-500"
                  />
                  Presentación
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeProposal}
                    onChange={(event) => setIncludeProposal(event.target.checked)}
                    className="h-3.5 w-3.5 accent-lime-500"
                  />
                  Propuesta
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeTasks}
                    onChange={(event) => setIncludeTasks(event.target.checked)}
                    className="h-3.5 w-3.5 accent-lime-500"
                  />
                  Tareas
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeRecap}
                    onChange={(event) => setIncludeRecap(event.target.checked)}
                    className="h-3.5 w-3.5 accent-lime-500"
                  />
                  Lo que vimos
                </label>
              </div>

              <input
                value={extraEmailsText}
                onChange={(event) => {
                  setExtraEmailsText(event.target.value);
                  setExtraEmailsError(null);
                }}
                placeholder="Correos adicionales (separados por coma)"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-lime-500/40"
              />
              {extraEmailsError && (
                <p className="mt-1 text-[10px] leading-relaxed text-rose-300">{extraEmailsError}</p>
              )}
              <p className="mt-1 text-[9px] leading-relaxed text-zinc-600">
                Los correos adicionales reciben solo este seguimiento. No se les envían
                recordatorios ni invitaciones.
              </p>

              <button
                type="button"
                onClick={handleSend}
                disabled={sendingSummary}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-lime-500/30 bg-lime-500/10 px-4 py-3 text-[11px] font-mono uppercase tracking-widest text-lime-200 transition-colors hover:bg-lime-500/20 disabled:opacity-50"
              >
                {sendingSummary ? "Enviando…" : "Enviar seguimiento"}
              </button>
              {summaryMessage && (
                <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-400">{summaryMessage}</p>
              )}
            </div>
          )}

          {canRejoin && (
            <button
              type="button"
              onClick={onRejoin}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-lime-500/30 bg-lime-500/10 px-4 py-3 text-[11px] font-mono uppercase tracking-widest text-lime-200 transition-colors hover:bg-lime-500/20"
            >
              <RotateCcw className="h-4 w-4" />
              Volver a entrar
            </button>
          )}

          {showInternalLinks && (
          <a
            href="/nexus/agenda"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-[11px] font-mono font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
          >
            Ir a la agenda
            <ArrowRight className="h-4 w-4" />
          </a>
          )}

          {showInternalLinks && (
            <a
              href="/nexus"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
            >
              Ir a Nexus
            </a>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Puedes cerrar esta pestaña cuando quieras
        </p>
      </div>
    </div>
  );
}
