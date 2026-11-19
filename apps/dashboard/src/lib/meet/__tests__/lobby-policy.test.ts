import { describe, it, expect } from "vitest";
import { shouldShowLobby } from "../lobby-policy";

describe("🚪 Lobby — regla de visibilidad", () => {
  it("LB-01: el host nunca espera (aunque el host no figure presente)", () => {
    expect(
      shouldShowLobby({ hasMeeting: true, isHost: true, hostPresent: false, entered: false })
    ).toBe(false);
  });

  it("LB-02: el host ve el lobby solo con ?lobby=1 (vista previa)", () => {
    expect(
      shouldShowLobby({
        hasMeeting: true,
        isHost: true,
        hostPresent: false,
        entered: false,
        previewLobby: true,
      })
    ).toBe(true);
  });

  it("LB-03: el invitado espera solo si sabemos que el host no está", () => {
    expect(
      shouldShowLobby({ hasMeeting: true, isHost: false, hostPresent: false, entered: false })
    ).toBe(true);
  });

  it("LB-04: si el host ya está, el invitado pasa directo", () => {
    expect(
      shouldShowLobby({ hasMeeting: true, isHost: false, hostPresent: true, entered: false })
    ).toBe(false);
  });

  it("LB-05: si no se pudo saber (null), no se encierra a nadie", () => {
    expect(
      shouldShowLobby({ hasMeeting: true, isHost: false, hostPresent: null, entered: false })
    ).toBe(false);
  });

  it("LB-06: una vez dentro, el lobby no vuelve a montarse", () => {
    expect(
      shouldShowLobby({ hasMeeting: true, isHost: true, hostPresent: false, entered: true, previewLobby: true })
    ).toBe(false);
    expect(
      shouldShowLobby({ hasMeeting: true, isHost: false, hostPresent: false, entered: true })
    ).toBe(false);
  });

  it("LB-07: sin meetingId todavía no hay lobby (aún cargando)", () => {
    expect(
      shouldShowLobby({ hasMeeting: false, isHost: false, hostPresent: false, entered: false })
    ).toBe(false);
  });
});
