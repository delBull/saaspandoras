"use client";

/**
 * Ciclo de vida del token de sesión de Nexus en el navegador.
 *
 * Regla: el token de magic link se canjea **una sola vez** por una cookie
 * `httpOnly`. Después de eso, JavaScript ya no tiene ninguna credencial de sesión:
 * las peticiones se autentican con la cookie (mismo origen).
 */

export const NEXUS_TOKEN_STORAGE_KEY = "pandoras_nexus_token";

export function readNexusTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("token");
}

export function readStoredNexusToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NEXUS_TOKEN_STORAGE_KEY);
}

/** Borra el token de la barra de direcciones sin recargar (respeta ?tour / ?role). */
export function scrubNexusTokenFromUrl(): void {
  if (typeof window === "undefined" || !window.location.search) return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("token")) return;
  url.searchParams.delete("token");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`
  );
}

let inFlight: Promise<boolean> | null = null;
let inFlightToken: string | null = null;

/**
 * Canjea un token de magic link por una cookie de sesión `httpOnly`.
 *
 * El servidor quema el token presentado (un solo uso) y emite uno nuevo que
 * JavaScript nunca ve. Devuelve `true` sólo si la cookie quedó establecida.
 * Las llamadas concurrentes con el mismo token comparten la misma petición
 * (React monta dos veces los efectos en desarrollo).
 */
export async function exchangeNexusSession(token: string): Promise<boolean> {
  if (!token) return false;
  if (inFlight && inFlightToken === token) return inFlight;

  inFlightToken = token;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/nexus/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      return res.ok;
    } catch {
      return false;
    }
  })();

  const ok = await inFlight;
  if (!ok) {
    // Permite reintentar (p. ej. fallo de red): el servidor no rotó el token.
    inFlight = null;
    inFlightToken = null;
  }
  return ok;
}
