/**
 * Enlace “Añadir a Google Calendar” (render URL, sin OAuth).
 *
 * Google Calendar acepta un evento prellenado por query string:
 *   https://calendar.google.com/calendar/render?action=TEMPLATE&...
 *
 * Es un clic manual: el host revisa y guarda. No escribe en su calendario por API
 * ni requiere credenciales de Google Cloud. Para sincronización automática real
 * hace falta OAuth (ver hoja de ruta multi-tenant).
 *
 * Reglas:
 * - Fechas SIEMPRE en UTC (`YYYYMMDDTHHMMSSZ`); `ctz` solo afecta la visualización.
 * - Si no hay `endsAt`, se asume 30 minutos (mismo default de agenda).
 * - Si no hay `startsAt` válido, no se genera enlace (nunca inventar fecha).
 */

export interface GoogleCalendarEventInput {
  title: string;
  startsAt: Date | string | null | undefined;
  endsAt?: Date | string | null;
  details?: string | null;
  location?: string | null;
  timeZone?: string;
}

const DEFAULT_TIME_ZONE = "America/Mexico_City";
const DEFAULT_DURATION_MINUTES = 30;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarUrl(input: GoogleCalendarEventInput): string | null {
  const start = toDate(input.startsAt);
  if (!start) return null;

  const end =
    toDate(input.endsAt) ?? new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60_000);
  if (end.getTime() <= start.getTime()) {
    return null;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title?.trim() || "Pandora's · Sovereign Meet",
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
    ctz: input.timeZone || DEFAULT_TIME_ZONE,
  });

  if (input.details?.trim()) params.set("details", input.details.trim());
  if (input.location?.trim()) params.set("location", input.location.trim());

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
