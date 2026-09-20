import { SovereignDisplayProfile } from "./types";
import { DEFAULT_DISPLAY_PROFILE } from "./constants";

export const VALID_SCALES = ["100", "115", "130"] as const;
export const VALID_THEMES = ["base", "high-contrast", "sepia", "grayscale", "low-light", "blancos"] as const;

/**
 * Sanitiza cualquier payload de perfil asegurando un contrato defensivo,
 * eliminando cualquier campo arbitrario (ej. tenantId, role, capabilities)
 * y aplicando fallbacks seguros.
 */
export function sanitizeProfile(raw: unknown): SovereignDisplayProfile {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_DISPLAY_PROFILE };
  }

  const obj = raw as Record<string, unknown>;

  const scale =
    typeof obj.scale === "string" && (VALID_SCALES as readonly string[]).includes(obj.scale)
      ? (obj.scale as SovereignDisplayProfile["scale"])
      : DEFAULT_DISPLAY_PROFILE.scale;

  const theme =
    typeof obj.theme === "string" && (VALID_THEMES as readonly string[]).includes(obj.theme)
      ? (obj.theme as SovereignDisplayProfile["theme"])
      : DEFAULT_DISPLAY_PROFILE.theme;

  const magnifier =
    typeof obj.magnifier === "boolean" ? obj.magnifier : DEFAULT_DISPLAY_PROFILE.magnifier;
  const reducedMotion =
    typeof obj.reducedMotion === "boolean" ? obj.reducedMotion : DEFAULT_DISPLAY_PROFILE.reducedMotion;

  return {
    scale,
    theme,
    magnifier,
    reducedMotion,
  };
}

/**
 * Aplica el perfil Sovereign Display directamente al DOM de forma atómica y no destructiva.
 * Acepta elementos explícitos para testing y ejecución headless.
 */
export function applyProfileToDom(
  profile: SovereignDisplayProfile,
  rootElement?: HTMLElement | null,
  bodyElement?: HTMLElement | null
): void {
  const root = rootElement ?? (typeof document !== "undefined" ? document.documentElement : null);
  const body = bodyElement ?? (typeof document !== "undefined" ? document.body : null);

  if (!root || !body) return;

  // 1. Escala discreta de tipografía / layout (Usando zoom para no romper grids/flex)
  if (profile.scale === "115") {
    root.style.fontSize = ""; // reset
    (root.style as any).zoom = "1.15";
  } else if (profile.scale === "130") {
    root.style.fontSize = ""; // reset
    (root.style as any).zoom = "1.30";
  } else {
    root.style.fontSize = ""; 
    (root.style as any).zoom = "";
  }

  // 2. Tokens semánticos mediante data attribute
  root.setAttribute("data-display-theme", profile.theme);

  // 3. Accesibilidad: Reduced Motion
  if (profile.reducedMotion) {
    body.classList.add("display-reduced-motion");
  } else {
    body.classList.remove("display-reduced-motion");
  }

  // 4. Lupa Focal Segura
  if (profile.magnifier) {
    body.classList.add("display-magnifier-active");
  } else {
    body.classList.remove("display-magnifier-active");
  }
}
