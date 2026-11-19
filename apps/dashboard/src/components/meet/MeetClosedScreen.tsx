"use client";

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
}: MeetClosedScreenProps) {
  const ended = reason === "ended";

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
      ? "Se cerró para todos. La minuta, la grabación y las tareas se generan desde la agenda."
      : "El anfitrión cerró la reunión para todos. Si hay minuta o tareas, quedarán en la agenda."
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
            El seguimiento (minuta, tareas y grabación) vive en la agenda de Nexus. No se
            envía nada a los invitados sin que el anfitrión lo revise.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
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

          <a
            href="/nexus/agenda"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-[11px] font-mono font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
          >
            Ir a la agenda
            <ArrowRight className="h-4 w-4" />
          </a>

          <a
            href="/nexus"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
          >
            Ir a Nexus
          </a>
        </div>

        <p className="mt-4 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Puedes cerrar esta pestaña cuando quieras
        </p>
      </div>
    </div>
  );
}
