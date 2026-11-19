/**
 * Enlaces de reunión: cortos para compartir, canónicos para la app.
 *
 * El ID canónico de una reunión es un UUID (36 caracteres). Un enlace para
 * invitados con `?p=<joinToken>` (32 hex) terminaba en ~80 caracteres, que se
 * parte en WhatsApp y en la barra del navegador. Aquí derivamos un código de
 * 12 caracteres a partir del UUID: suficiente entropía (48 bits) para que no
 * colisione en la práctica y sin tabla nueva ni migración.
 *
 * `/m/<code>` resuelve el UUID server-side y redirige a `/meet/<uuid>`
 * conservando `?p=`, así que los enlaces viejos siguen funcionando.
 */

export const MEETING_SHORT_CODE_LENGTH = 12;

/** Código corto determinista a partir del UUID (sin guiones). */
export function meetingShortCode(meetingId: string): string {
  return meetingId.replace(/-/g, "").toLowerCase().slice(0, MEETING_SHORT_CODE_LENGTH);
}

/** Ruta corta relativa, con token personal si existe. */
export function shortMeetingPath(meetingId: string, joinToken?: string | null): string {
  const path = `/m/${meetingShortCode(meetingId)}`;
  return joinToken ? `${path}?p=${encodeURIComponent(joinToken)}` : path;
}

/** URL absoluta corta para emails, recordatorios y "compartir". */
export function shortMeetingUrl(
  baseUrl: string,
  meetingId: string,
  joinToken?: string | null
): string {
  return `${baseUrl.replace(/\/+$/, "")}${shortMeetingPath(meetingId, joinToken)}`;
}

interface ShareInput {
  title?: string | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  url: string;
  /** Zona horaria de la casa; por defecto CDMX. */
  timeZone?: string;
  /** Etiqueta de la zona, p. ej. "CDMX". */
  timeZoneLabel?: string;
}

const DEFAULT_TIME_ZONE = "America/Mexico_City";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Texto para compartir, estilo Zoom: título, día y hora, enlace y firma.
 * Devuelve solo el enlace si no hay fecha (nunca inventa horarios).
 */
export function buildMeetingShareText({
  title,
  startsAt,
  endsAt,
  url,
  timeZone = DEFAULT_TIME_ZONE,
  timeZoneLabel = "CDMX",
}: ShareInput): string {
  const start = toDate(startsAt);
  const end = toDate(endsAt);
  const lines: string[] = [];

  if (title) lines.push(title);

  if (start) {
    const day = start.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    });
    const startTime = start.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    });
    const endTime = end
      ? end.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone })
      : null;

    const range = endTime ? `${startTime} – ${endTime}` : startTime;
    lines.push(`${day} · ${range} (${timeZoneLabel})`);
  }

  lines.push("", "Únete con el enlace:", url, "", "Pandora's · Sovereign Meet");
  return lines.join("\n");
}

/**
 * Comparte con la hoja nativa si existe (móvil) y cae a portapapeles.
 * Devuelve cómo terminó para que la UI pueda decir "Copiado" o "Compartido".
 */
export async function shareOrCopyMeeting(input: ShareInput): Promise<"shared" | "copied" | "failed"> {
  const text = buildMeetingShareText(input);
  const shareData = {
    title: input.title ?? "Pandora's · Sovereign Meet",
    text,
    url: input.url,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      // El usuario canceló la hoja nativa: no es un fallo, pero tampoco copiamos
      // sin permiso. Solo caemos a portapapeles si el error no es "AbortError".
      if (error instanceof DOMException && error.name === "AbortError") return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
