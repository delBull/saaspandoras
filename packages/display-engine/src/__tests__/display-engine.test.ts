// @ts-ignore
import { describe, it, expect, beforeEach } from "bun:test";
import { DEFAULT_DISPLAY_PROFILE, LOCAL_STORAGE_KEY } from "../constants";
import { applyProfileToDom, sanitizeProfile, VALID_SCALES, VALID_THEMES } from "../engine";
import type { SovereignDisplayProfile, SovereignDisplayScale, SovereignDisplayTheme } from "../types";

describe("@pandoras/display-engine — Domain & Contract Specification", () => {
  it("should have correct default display profile according to specification", () => {
    expect(DEFAULT_DISPLAY_PROFILE).toEqual({
      scale: "100",
      theme: "base",
      magnifier: false,
      reducedMotion: false,
    });
  });

  it("should enforce the origin-bound localStorage key namespace", () => {
    expect(LOCAL_STORAGE_KEY).toBe("pandoras:display-profile");
  });

  it("should only allow strict valid scale increments (100, 115, 130)", () => {
    const validScales: SovereignDisplayScale[] = ["100", "115", "130"];
    validScales.forEach((scale) => {
      expect(VALID_SCALES).toContain(scale);
    });
  });

  it("should only allow semantic themes (base, high-contrast, sepia, grayscale, low-light)", () => {
    const validThemes: SovereignDisplayTheme[] = [
      "base",
      "high-contrast",
      "sepia",
      "grayscale",
      "low-light",
    ];
    validThemes.forEach((theme) => {
      expect(VALID_THEMES).toContain(theme);
    });
  });

  it("should maintain strict boundary separation from Hermes context", () => {
    const keys = Object.keys(DEFAULT_DISPLAY_PROFILE);
    expect(keys).not.toContain("identity");
    expect(keys).not.toContain("capability");
    expect(keys).not.toContain("policy");
    expect(keys).not.toContain("role");
    expect(keys).not.toContain("tenantId");
    expect(keys).not.toContain("executionAuthority");
  });
});

describe("@pandoras/display-engine — REAL Production DOM Mutation Engine", () => {
  let mockHtml: { style: { fontSize: string }; setAttribute: (k: string, v: string) => void; attributes: Record<string, string> };
  let mockBody: { classList: { add: (c: string) => void; remove: (c: string) => void; contains: (c: string) => boolean } };
  let classSet: Set<string>;

  beforeEach(() => {
    const attrs: Record<string, string> = {};
    mockHtml = {
      style: { fontSize: "" },
      setAttribute: (k: string, v: string) => { attrs[k] = v; },
      attributes: attrs,
    };
    classSet = new Set<string>();
    mockBody = {
      classList: {
        add: (c: string) => { classSet.add(c); },
        remove: (c: string) => { classSet.delete(c); },
        contains: (c: string) => classSet.has(c),
      },
    };
  });

  it("invokes REAL applyProfileToDom: applies discrete scale 115% as 18.4px and 130% as 20.8px to html root", () => {
    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, scale: "115" }, mockHtml as any, mockBody as any);
    expect(mockHtml.style.fontSize).toBe("18.4px");

    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, scale: "130" }, mockHtml as any, mockBody as any);
    expect(mockHtml.style.fontSize).toBe("20.8px");

    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, scale: "100" }, mockHtml as any, mockBody as any);
    expect(mockHtml.style.fontSize).toBe("");
  });

  it("invokes REAL applyProfileToDom: sets data-display-theme attribute on document root for CSS semantic tokens", () => {
    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, theme: "sepia" }, mockHtml as any, mockBody as any);
    expect(mockHtml.attributes["data-display-theme"]).toBe("sepia");

    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, theme: "high-contrast" }, mockHtml as any, mockBody as any);
    expect(mockHtml.attributes["data-display-theme"]).toBe("high-contrast");
  });

  it("invokes REAL applyProfileToDom: toggles display-reduced-motion class on body", () => {
    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, reducedMotion: true }, mockHtml as any, mockBody as any);
    expect(mockBody.classList.contains("display-reduced-motion")).toBe(true);

    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, reducedMotion: false }, mockHtml as any, mockBody as any);
    expect(mockBody.classList.contains("display-reduced-motion")).toBe(false);
  });

  it("invokes REAL applyProfileToDom: toggles display-magnifier-active class on body for opt-in focal magnification", () => {
    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, magnifier: true }, mockHtml as any, mockBody as any);
    expect(mockBody.classList.contains("display-magnifier-active")).toBe(true);

    applyProfileToDom({ ...DEFAULT_DISPLAY_PROFILE, magnifier: false }, mockHtml as any, mockBody as any);
    expect(mockBody.classList.contains("display-magnifier-active")).toBe(false);
  });
});

describe("@pandoras/display-engine — REAL Production Sanitization Engine", () => {
  it("invokes REAL sanitizeProfile: strips unauthorized fields (tenantId, role, capabilities)", () => {
    const maliciousPayload = {
      scale: "115",
      theme: "sepia",
      magnifier: true,
      reducedMotion: false,
      tenantId: "hacked_tenant",
      role: "SUPER_ADMIN",
      capabilities: { ALL_ACCESS: true },
    };

    const sanitized = sanitizeProfile(maliciousPayload);
    expect(sanitized).toEqual({
      scale: "115",
      theme: "sepia",
      magnifier: true,
      reducedMotion: false,
    });
    expect((sanitized as any).role).toBeUndefined();
    expect((sanitized as any).tenantId).toBeUndefined();
    expect((sanitized as any).capabilities).toBeUndefined();
  });

  it("invokes REAL sanitizeProfile: safely falls back when scale or theme contains invalid injection", () => {
    const corruptedPayload = {
      scale: "9999",
      theme: "eval('window.hack()')",
      magnifier: "not_a_boolean",
      reducedMotion: 42,
    };

    const sanitized = sanitizeProfile(corruptedPayload);
    expect(sanitized).toEqual({
      scale: "100",
      theme: "base",
      magnifier: false,
      reducedMotion: false,
    });
  });

  it("invokes REAL sanitizeProfile: handles null, undefined and non-object gracefully", () => {
    expect(sanitizeProfile(null)).toEqual(DEFAULT_DISPLAY_PROFILE);
    expect(sanitizeProfile(undefined)).toEqual(DEFAULT_DISPLAY_PROFILE);
    expect(sanitizeProfile("string_payload")).toEqual(DEFAULT_DISPLAY_PROFILE);
  });
});
