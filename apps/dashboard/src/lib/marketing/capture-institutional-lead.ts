import { headers } from 'next/headers';

/**
 * Canonical capture for the dashboard's OWN institutional marketing forms
 * (asset-capitalization, bitcoin-initiative, etc.).
 *
 * Reuses the canonical lead-ingestion endpoint `/api/v1/marketing/leads/register`
 * so identity resolution, attribution, growth-engine actions, webhooks and team
 * alerts all fire — instead of a parallel/duplicated ingestion path.
 *
 * Tenant authority: the platform resolves the canonical project from the
 * `pandoras` slug server-side. It is NOT taken from client input.
 */
export interface InstitutionalLeadInput {
  email: string;
  name?: string;
  community?: string;
  assetType?: string;
  message?: string;
  /** Machine-readable origin of the form, e.g. 'asset_capitalization_playbook'. */
  source: string;
  /** Extra metadata tags (they get prefixed with B2B_ by the pipeline). */
  tags?: string[];
}

export interface InstitutionalLeadResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export async function captureInstitutionalLead(
  input: InstitutionalLeadInput,
): Promise<InstitutionalLeadResult> {
  const email = input.email?.trim();
  if (!email) {
    return { ok: false, error: 'missing_email' };
  }

  // Resolve our own origin from the incoming request (works in prod, previews and local).
  let origin = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    if (host) origin = `${proto}://${host}`;
  } catch {
    // headers() unavailable (e.g. invoked outside a request scope) — fall back to app URL.
  }

  try {
    const res = await fetch(`${origin}/api/v1/marketing/leads/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Internal-origin routing: this server action IS the dashboard's own marketing
        // form, which the ingestion endpoint explicitly tolerates (never a client header).
        origin,
      },
      body: JSON.stringify({
        name: input.name,
        email,
        intent: 'invest',
        scope: 'b2b',
        consent: true,
        projectId: 'pandoras', // canonical slug — resolved server-side, never trusted from client
        metadata: {
          source: input.source,
          tags: ['INSTITUTIONAL', ...(input.tags || [])],
          community: input.community,
          assetType: input.assetType,
          message: input.message,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(
        `[captureInstitutionalLead] register failed (${res.status}) for source=${input.source}: ${detail.slice(0, 300)}`,
      );
      return { ok: false, status: res.status, error: `register_${res.status}` };
    }

    return { ok: true, status: res.status };
  } catch (err: any) {
    console.error(
      `[captureInstitutionalLead] network error for source=${input.source}:`,
      err?.message || err,
    );
    return { ok: false, error: 'network' };
  }
}
