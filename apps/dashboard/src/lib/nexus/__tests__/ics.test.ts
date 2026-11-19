import { describe, it, expect } from "vitest";
import { buildMeetingIcs, icsAttachment } from "../ics";

const START = new Date("2026-11-23T15:00:00.000Z");
const END = new Date("2026-11-23T15:45:00.000Z");

describe("📅 ICS de reunión", () => {
  it("ICS-01: genera un VEVENT con fechas en UTC y CRLF", () => {
    const ics = buildMeetingIcs({
      uid: "meeting-123@dash.pandoras.finance",
      start: START,
      end: END,
      summary: "Presentación · Celeste",
      description: "Entra a la sala: https://dash.pandoras.finance/meet/abc",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("DTSTART:20261123T150000Z");
    expect(ics).toContain("DTEND:20261123T154500Z");
    expect(ics).toContain("UID:meeting-123@dash.pandoras.finance");
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics).not.toContain("\n\n");
  });

  it("ICS-02: escapa comas, puntos y coma y saltos de línea", () => {
    const ics = buildMeetingIcs({
      uid: "x@y",
      start: START,
      end: END,
      summary: "Sesión, con; signos: y salto\nnueva línea",
    });

    expect(ics).toContain("SUMMARY:Sesión\\, con\\; signos: y salto\\nnueva línea");
  });

  it("ICS-03: incluye organizador y asistente cuando se conocen", () => {
    const ics = buildMeetingIcs({
      uid: "x@y",
      start: START,
      end: END,
      summary: "Sesión",
      attendeeEmail: "eduardo@celeste.com",
      organizerEmail: "hello@pandoras.finance",
      organizerName: "Pandora's Group",
    });

    expect(ics).toContain("ORGANIZER;CN=Pandora's Group:mailto:hello@pandoras.finance");
    expect(ics).toContain("ATTENDEE;CN=eduardo@celeste.com;ROLE=REQ-PARTICIPANT");
    expect(ics).toContain("mailto:eduardo@celeste.com");
  });

  it("ICS-04: pliega líneas largas a 75 octetos", () => {
    const ics = buildMeetingIcs({
      uid: "x@y",
      start: START,
      end: END,
      summary: "Sesión",
      description: "A".repeat(200),
    });
    const folded = ics.split("\r\n");
    for (const line of folded) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it("ICS-05: el adjunto es base64 del mismo contenido", () => {
    const attachment = icsAttachment({
      uid: "x@y",
      start: START,
      end: END,
      summary: "Sesión",
    });

    expect(attachment.filename).toBe("invitacion-pandoras.ics");
    expect(attachment.content_type).toContain("text/calendar");
    const decoded = Buffer.from(attachment.content, "base64").toString("utf8");
    expect(decoded).toContain("SUMMARY:Sesión");
  });
});
