import { describe, it, expect } from "vitest";
import { buildGoogleCalendarUrl } from "../google-calendar";

describe("📅 Google Calendar (enlace rápido, sin OAuth)", () => {
  it("GC-01: genera un evento con título, fechas UTC, detalles, ubicación y zona", () => {
    const url = buildGoogleCalendarUrl({
      title: "Celeste · Sistema Comercial",
      startsAt: "2026-11-19T16:00:00.000Z", // 10:00 CDMX
      endsAt: "2026-11-19T16:30:00.000Z",
      details: "Entra a la sala: https://nexus.pandoras.finance/m/abc",
      location: "https://nexus.pandoras.finance/m/abc",
    });

    expect(url).toBeTruthy();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(parsed.searchParams.get("action")).toBe("TEMPLATE");
    expect(parsed.searchParams.get("text")).toBe("Celeste · Sistema Comercial");
    expect(parsed.searchParams.get("dates")).toBe("20261119T160000Z/20261119T163000Z");
    expect(parsed.searchParams.get("ctz")).toBe("America/Mexico_City");
    expect(parsed.searchParams.get("details")).toContain("Entra a la sala");
    expect(parsed.searchParams.get("location")).toContain("/m/abc");
  });

  it("GC-02: si no hay fin, asume 30 minutos", () => {
    const url = buildGoogleCalendarUrl({
      title: "Reunión externa",
      startsAt: "2026-11-19T16:00:00.000Z",
    });
    const dates = new URL(url!).searchParams.get("dates");
    expect(dates).toBe("20261119T160000Z/20261119T163000Z");
  });

  it("GC-03: sin fecha válida no inventa evento", () => {
    expect(buildGoogleCalendarUrl({ title: "X", startsAt: null })).toBeNull();
    expect(buildGoogleCalendarUrl({ title: "X", startsAt: "no-es-fecha" })).toBeNull();
  });

  it("GC-04: un fin anterior al inicio se rechaza", () => {
    const url = buildGoogleCalendarUrl({
      title: "X",
      startsAt: "2026-11-19T16:00:00.000Z",
      endsAt: "2026-11-19T15:00:00.000Z",
    });
    expect(url).toBeNull();
  });

  it("GC-05: escapa títulos y detalles con caracteres especiales", () => {
    const url = buildGoogleCalendarUrl({
      title: "Sesión & revisión",
      startsAt: "2026-11-19T16:00:00.000Z",
      details: "Liga: https://x.test/a?b=1&c=2",
    });
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("text")).toBe("Sesión & revisión");
    expect(parsed.searchParams.get("details")).toBe("Liga: https://x.test/a?b=1&c=2");
  });
});
