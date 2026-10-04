/**
 * fetchAcademy — Academy API Bridge Helper
 *
 * A1 of the Academy Standalone Migration (ACADEMY_PHASE_A_AUDIT.md).
 *
 * Resolves the ACADEMY_API_BASE_URL so that all fetch calls from
 * apps/academy can be directed to the correct backend regardless of
 * where the academy app is deployed.
 *
 * Behavior:
 *   - In production (academy.pandoras.finance standalone):
 *       ACADEMY_API_BASE_URL="" (empty) → calls are relative (/api/...) → resolved by the
 *       academy app's own Next.js API routes (after migration is complete).
 *   - During transition (before all routes are migrated):
 *       ACADEMY_API_BASE_URL="https://dash.pandoras.finance" → proxied to dashboard.
 *   - In development:
 *       ACADEMY_API_BASE_URL="http://localhost:3000" (or leave empty for :3003 self-hosted).
 *
 * Usage:
 *   import { fetchAcademy } from '@/lib/fetch-academy';
 *   const res = await fetchAcademy('/api/admin/academy/unlock', { method: 'POST', body: ... });
 */

const ACADEMY_API_BASE_URL =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ACADEMY_API_BASE_URL ?? process.env.ACADEMY_API_BASE_URL ?? '')
    : '';

/**
 * Fetch wrapper that prepends ACADEMY_API_BASE_URL to relative API paths.
 * Behaves identically to the global fetch for absolute URLs.
 */
export function fetchAcademy(path: string, init?: RequestInit): Promise<Response> {
  const base = ACADEMY_API_BASE_URL.replace(/\/$/, '');
  const url = path.startsWith('http') ? path : `${base}${path}`;
  return fetch(url, init);
}
