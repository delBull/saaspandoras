import { describe, it, expect } from "vitest";
import {
  meetingShortCode,
  shortMeetingPath,
  shortMeetingUrl,
  buildMeetingShareText,
} from "../meeting-links";

const MEETING_ID = "3f4b7c1e-0000-4000-8000-000000000001";

describe("🔗 Enlaces cortos de reunión", () => {
  it("ML-01: el código son 12 caracteres del UUID sin guiones (determinista)", () => {
    expect(meetingShortCode(MEETING_ID)).toBe("3f4b7c1e0000");
    expect(meetingShortCode(MEETING_ID)).toHaveLength(12);
    // Mismo id, mismo código: no hay estado ni tabla intermedia.
    expect(meetingShortCode(MEETING_ID)).toBe(meetingShortCode(MEETING_ID));
  });

  it("ML-02: la ruta corta conserva y codifica el token personal", () => {
    expect(shortMeetingPath(MEETING_ID)).toBe("/m/3f4b7c1e0000");
    expect(shortMeetingPath(MEETING_ID, "abc123")).toBe("/m/3f4b7c1e0000?p=abc123");
    expect(shortMeetingPath(MEETING_ID, "a+b/c=")).toBe("/m/3f4b7c1e0000?p=a%2Bb%2Fc%3D");
  });

  it("ML-03: la URL absoluta no duplica la barra final", () => {
    expect(shortMeetingUrl("https://nexus.pandoras.finance/", MEETING_ID)).toBe(
      "https://nexus.pandoras.finance/m/3f4b7c1e0000"
    );
  });

  it("ML-04: el texto para compartir trae título, día, hora, enlace y firma", () => {
    const text = buildMeetingShareText({
      title: "Celeste · Sistema Comercial",
      startsAt: "2026-11-19T16:00:00.000Z", // 10:00 en CDMX
      endsAt: "2026-11-19T16:30:00.000Z",
      url: "https://nexus.pandoras.finance/m/3f4b7c1e0000",
    });

    expect(text).toContain("Celeste · Sistema Comercial");
    expect(text).toContain("10:00 – 10:30 (CDMX)");
    expect(text).toContain("https://nexus.pandoras.finance/m/3f4b7c1e0000");
    expect(text).toContain("Pandora's · Sovereign Meet");
  });

  it("ML-05: sin fecha no inventa horario (solo título y enlace)", () => {
    const text = buildMeetingShareText({
      title: "Sovereign Meet",
      url: "https://nexus.pandoras.finance/m/abc",
    });

    expect(text).toContain("Sovereign Meet");
    expect(text).not.toMatch(/CDMX/);
    expect(text).toContain("https://nexus.pandoras.finance/m/abc");
  });
});
