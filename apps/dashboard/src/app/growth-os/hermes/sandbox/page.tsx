import { redirect } from 'next/navigation';

/**
 * /growth-os/hermes/sandbox — Permanent redirect (HTTP 308) to the canonical
 * public simulator route. Preserves all query parameters for backward-compatible
 * deep links (e.g., ?company=...&industry=...&rep=...).
 *
 * Uses Next.js server-side redirect() so the HTTP status is correctly 308,
 * not a client-side JS navigation with no HTTP semantics.
 */
export default async function SandboxRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      const v = Array.isArray(value) ? value[0] : value;
      if (v) qs.set(key, v);
    }
  }

  const queryString = qs.toString();
  redirect(`/hermes/simulator${queryString ? `?${queryString}` : ''}`);
}
