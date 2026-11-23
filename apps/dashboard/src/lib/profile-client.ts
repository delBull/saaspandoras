"use client";

/**
 * Caché de `/api/profile` para el shell de la app.
 *
 * El sidebar y el topbar se montan en cada navegación y ambos pedían el perfil:
 * dos requests por página, cada una con consultas pesadas y una llamada externa
 * al Edge. Esta caché deduplica en vuelo y guarda 5 minutos por wallet.
 *
 * No es autoridad: el servidor sigue resolviendo identidad y rol en cada request
 * real. Aquí sólo se evita repetir la misma lectura.
 */

type ProfilePayload = Record<string, unknown>;

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: ProfilePayload }>();
const inflight = new Map<string, Promise<ProfilePayload | null>>();

function keyOf(wallet: string): string {
  return wallet.toLowerCase();
}

export function invalidateProfile(wallet?: string | null): void {
  if (wallet) cache.delete(keyOf(wallet));
  else cache.clear();
}

export async function getProfile(
  wallet: string | null | undefined,
  options: { force?: boolean } = {},
): Promise<ProfilePayload | null> {
  if (!wallet) return null;
  const key = keyOf(wallet);

  if (!options.force) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

    const pending = inflight.get(key);
    if (pending) return pending;
  }

  const request = (async (): Promise<ProfilePayload | null> => {
    try {
      const response = await fetch("/api/profile", {
        headers: {
          "Content-Type": "application/json",
          "x-thirdweb-address": wallet,
          "x-wallet-address": wallet,
          "x-user-address": wallet,
        },
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = (await response.json()) as ProfilePayload;
      cache.set(key, { at: Date.now(), data });
      return data;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}
