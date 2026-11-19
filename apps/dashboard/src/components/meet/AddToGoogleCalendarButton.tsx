"use client";

import { CalendarPlus } from "lucide-react";
import { buildGoogleCalendarUrl } from "@/lib/meet/google-calendar";

interface AddToGoogleCalendarButtonProps {
  title: string;
  startsAt: Date | string | null;
  endsAt?: Date | string | null;
  /** Ruta interna de la sala (p. ej. `/m/abc` o `/m/abc?p=token`). */
  meetingPath?: string | null;
  hostName?: string | null;
  /** `compact` = icono (+ texto en desktop); `full` = botón ancho. */
  variant?: "compact" | "full";
  className?: string;
}

/**
 * Enlace rápido a Google Calendar (render URL, sin OAuth).
 * El host revisa y guarda el evento; no escribe por API.
 */
export function AddToGoogleCalendarButton({
  title,
  startsAt,
  endsAt,
  meetingPath,
  hostName,
  variant = "compact",
  className = "",
}: AddToGoogleCalendarButtonProps) {
  // Valida la fecha en render; si no hay fecha, no se muestra el botón.
  const canRender = Boolean(buildGoogleCalendarUrl({ title, startsAt, endsAt }));
  if (!canRender) return null;

  const handleClick = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const absoluteUrl = meetingPath ? `${origin}${meetingPath}` : null;

    const details = [
      "Sesión de Pandora's · Sovereign Meet",
      absoluteUrl ? `Entra a la sala: ${absoluteUrl}` : null,
      hostName ? `Anfitrión: ${hostName}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const url = buildGoogleCalendarUrl({
      title,
      startsAt,
      endsAt,
      details,
      location: absoluteUrl,
    });

    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const base =
    variant === "full"
      ? "w-full justify-center px-4 py-3 rounded-xl text-[11px]"
      : "justify-center gap-1.5 px-2.5 py-2.5 rounded-lg text-[10px]";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white font-mono uppercase tracking-wider ${base} ${className}`}
      title="Añadir a Google Calendar (abre un evento prellenado)"
      aria-label="Añadir a Google Calendar"
    >
      <CalendarPlus className="h-3.5 w-3.5" />
      <span className={variant === "full" ? "" : "hidden sm:inline"}>Google Calendar</span>
    </button>
  );
}
