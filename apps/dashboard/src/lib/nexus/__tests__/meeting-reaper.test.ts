import { describe, it, expect } from "vitest";
import { isStaleLiveMeeting } from "../meeting-reaper";

const NOW = new Date("2026-11-19T18:00:00.000Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000);
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60 * 1000);

describe("🧹 Reaper de reuniones live colgadas", () => {
  it("RPR-01: live sin endsAt y más de 2 h → stale", () => {
    expect(isStaleLiveMeeting({ status: "live", startsAt: hoursAgo(3), endsAt: null }, NOW)).toBe(true);
  });

  it("RPR-02: live sin endsAt y menos de 2 h → todavía no", () => {
    expect(isStaleLiveMeeting({ status: "live", startsAt: hoursAgo(1), endsAt: null }, NOW)).toBe(false);
  });

  it("RPR-03: live con endsAt hace más de 30 min → stale", () => {
    expect(
      isStaleLiveMeeting({ status: "live", startsAt: hoursAgo(3), endsAt: hoursAgo(1) }, NOW)
    ).toBe(true);
  });

  it("RPR-04: live con endsAt hace 10 min → respeta la gracia de 30 min", () => {
    expect(
      isStaleLiveMeeting({ status: "live", startsAt: hoursAgo(1), endsAt: minutesAgo(10) }, NOW)
    ).toBe(false);
  });

  it("RPR-05: scheduled/ended nunca se reapean por esta vía", () => {
    expect(isStaleLiveMeeting({ status: "scheduled", startsAt: hoursAgo(5) }, NOW)).toBe(false);
    expect(isStaleLiveMeeting({ status: "ended", startsAt: hoursAgo(5), endsAt: hoursAgo(4) }, NOW)).toBe(false);
  });

  it("RPR-06: live sin startsAt no se toca (no se inventa fecha)", () => {
    expect(isStaleLiveMeeting({ status: "live", startsAt: null, endsAt: null }, NOW)).toBe(false);
  });
});
