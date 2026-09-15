/**
 * 🌐 Nexus TMA — API Client
 * src/lib/api-client.ts
 *
 * Pre-configured HTTP client for consuming the Nexus Control Plane API.
 * - Automatically injects the session token from sessionStorage
 * - Targets VITE_NEXUS_API_URL (set in .env.local)
 * - Throws typed ApiError on non-2xx responses
 */

import type { NexusTmaSession } from './session-store';

declare const __NEXUS_API_URL__: string;

const BASE_URL = (typeof __NEXUS_API_URL__ !== 'undefined'
  ? __NEXUS_API_URL__
  : import.meta.env.VITE_NEXUS_API_URL || 'https://dash.pandoras.finance'
).replace(/\/$/, '');

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

/**
 * Authenticates with the Nexus TMA auth endpoint using Telegram initData.
 * Returns a NexusTmaSession on success.
 */
export async function authenticateWithInitData(initData: string): Promise<NexusTmaSession> {
  const res = await fetch(`${BASE_URL}/api/integrations/telegram/team/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  const data = await res.json() as { session?: NexusTmaSession; error?: string; code?: string };

  if (!res.ok) {
    throw new ApiError(res.status, data.code ?? 'API_ERROR', data.error ?? 'Authentication failed');
  }

  if (!data.session) {
    throw new ApiError(500, 'MISSING_SESSION', 'Server returned success but no session object.');
  }

  return data.session;
}

/**
 * Generic authenticated GET helper.
 * Reads the stored session token and sends it as Authorization header.
 */
export async function nexusGet<T>(
  path: string,
  sessionToken: string
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json() as T | { error?: string; code?: string };

  if (!res.ok) {
    const err = data as { error?: string; code?: string };
    throw new ApiError(res.status, err.code ?? 'API_ERROR', err.error ?? 'Request failed');
  }

  return data as T;
}

/**
 * Generic authenticated POST helper.
 */
export async function nexusPost<T = any>(
  path: string,
  body: any,
  sessionToken: string
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as T | { error?: string; code?: string };

  if (!res.ok) {
    const err = data as { error?: string; code?: string };
    throw new ApiError(res.status, err.code ?? 'API_ERROR', err.error ?? 'Request failed');
  }

  return data as T;
}

/**
 * Generic authenticated PATCH helper.
 */
export async function nexusPatch<T = any>(
  path: string,
  body: any,
  sessionToken: string
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as T | { error?: string; code?: string };

  if (!res.ok) {
    const err = data as { error?: string; code?: string };
    throw new ApiError(res.status, err.code ?? 'API_ERROR', err.error ?? 'Request failed');
  }

  return data as T;
}
