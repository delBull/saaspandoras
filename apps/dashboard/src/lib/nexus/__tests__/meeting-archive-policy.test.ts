import { describe, it, expect } from "vitest";
import { MeetingPolicy } from "../meeting-domain";

const auth = (overrides: Partial<any> = {}) => ({
  isAuthenticated: true,
  collaboratorId: 7,
  canonicalOrgId: "pandoras",
  role: "ADMIN",
  permissions: {},
  ...overrides,
}) as any;

const meeting = (overrides: Partial<any> = {}) => ({
  id: "meeting-1",
  canonicalOrgId: "pandoras",
  hostCollaboratorId: 7,
  status: "ended",
  archivedAt: null,
  ...overrides,
});

describe("✏️ Edición de reuniones programadas", () => {
  it("EDT-01: el host puede editar una reunión programada de su org", () => {
    expect(MeetingPolicy.canEdit(meeting({ status: "scheduled" }), auth())).toBe(true);
  });

  it("EDT-02: un participante o no-host no puede editar", () => {
    expect(MeetingPolicy.canEdit(meeting({ status: "scheduled" }), auth({ collaboratorId: 99 }))).toBe(false);
  });

  it("EDT-03: no se edita una reunión live, ended o cancelada", () => {
    expect(MeetingPolicy.canEdit(meeting({ status: "live" }), auth())).toBe(false);
    expect(MeetingPolicy.canEdit(meeting({ status: "ended" }), auth())).toBe(false);
    expect(MeetingPolicy.canEdit(meeting({ status: "cancelled" }), auth())).toBe(false);
  });

  it("EDT-04: no se edita cross-tenant ni sin sesión", () => {
    expect(MeetingPolicy.canEdit(meeting({ status: "scheduled", canonicalOrgId: "otro" }), auth())).toBe(false);
    expect(MeetingPolicy.canEdit(meeting({ status: "scheduled" }), auth({ isAuthenticated: false }))).toBe(false);
    expect(MeetingPolicy.canEdit(meeting({ status: "scheduled" }), auth({ canonicalOrgId: null }))).toBe(false);
  });
});

describe("🗂️ Archivado de reuniones pasadas (borrado lógico)", () => {
  it("ARC-01: el host puede archivar una reunión terminada de su org", () => {
    expect(MeetingPolicy.canArchive(meeting(), auth())).toBe(true);
  });

  it("ARC-02: un participante o no-host no puede archivar", () => {
    expect(MeetingPolicy.canArchive(meeting(), auth({ collaboratorId: 99 }))).toBe(false);
  });

  it("ARC-03: no se archiva una reunión programada o live", () => {
    expect(MeetingPolicy.canArchive(meeting({ status: "scheduled" }), auth())).toBe(false);
    expect(MeetingPolicy.canArchive(meeting({ status: "live" }), auth())).toBe(false);
  });

  it("ARC-04: no se archiva cross-tenant", () => {
    expect(MeetingPolicy.canArchive(meeting({ canonicalOrgId: "otro" }), auth())).toBe(false);
  });

  it("ARC-05: sin sesión no hay archivado", () => {
    expect(MeetingPolicy.canArchive(meeting(), auth({ isAuthenticated: false }))).toBe(false);
    expect(MeetingPolicy.canArchive(meeting(), auth({ collaboratorId: null }))).toBe(false);
    expect(MeetingPolicy.canArchive(meeting(), auth({ canonicalOrgId: null }))).toBe(false);
  });

  it("ARC-06: archivar de nuevo es idempotente", () => {
    expect(MeetingPolicy.canArchive(meeting({ archivedAt: new Date() }), auth())).toBe(true);
  });
});
