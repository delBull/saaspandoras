/**
 * Generador de invitaciones .ics (RFC 5545) para las reuniones de Sovereign Meet.
 *
 * Por qué existe: Zoom/Meet mandan un evento de calendario. Sin esto, el invitado
 * tiene que crear el evento a mano y la reunión se le olvida.
 *
 * Reglas:
 * - Fechas en UTC (`YYYYMMDDTHHMMSSZ`).
 * - Un `.ics` por destinatario, porque cada uno recibe su **liga personal** (así no
 *   se filtran los tokens de los demás).
 * - Sección 3.2.19: escapar `\`, `;`, `,` y saltos de línea en los campos de texto.
 */

export interface IcsMeetingInput {
  /** Identificador estable del evento (normalmente el id de la reunión) */
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  attendeeEmail?: string | null;
  organizerEmail?: string;
  organizerName?: string;
}

function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string): string {
  // RFC 5545: cada línea (incluido el espacio de continuación) ≤ 75 octetos.
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    chunks.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length > 0) chunks.push(" " + rest);
  return chunks.join("\r\n");
}

export function buildMeetingIcs(input: IcsMeetingInput): string {
  const {
    uid,
    start,
    end,
    summary,
    description,
    location,
    attendeeEmail,
    organizerEmail = "hello@pandoras.finance",
    organizerName = "Pandora's Group",
  } = input;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pandoras//Sovereign Meet//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    `ORGANIZER;CN=${escapeIcsText(organizerName)}:mailto:${organizerEmail}`,
    attendeeEmail
      ? `ATTENDEE;CN=${escapeIcsText(attendeeEmail)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${attendeeEmail}`
      : null,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];

  // CRLF obligatorio entre líneas y al final.
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function icsAttachment(input: IcsMeetingInput): { filename: string; content: string; content_type: string } {
  const ics = buildMeetingIcs(input);
  return {
    filename: "invitacion-pandoras.ics",
    content: Buffer.from(ics, "utf8").toString("base64"),
    content_type: "text/calendar; method=REQUEST",
  };
}
