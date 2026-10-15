import type { NextRequest } from 'next/server';

export type IntegrationEnvironment = 'staging' | 'production';

/**
 * Environment allowlist for the operational A2A endpoints.
 *
 * Defaults to allowing BOTH environments so wiring this in is behavior-preserving.
 * Set `A2A_ALLOWED_ENVIRONMENTS` (e.g. `production`) to lock the endpoints to a
 * subset without a code change.
 */
export function allowedA2AEnvironments(): IntegrationEnvironment[] {
  const raw = (process.env.A2A_ALLOWED_ENVIRONMENTS || '').trim().toLowerCase();
  if (!raw) return ['staging', 'production'];
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is IntegrationEnvironment => s === 'staging' || s === 'production');
  return parsed.length > 0 ? parsed : ['staging', 'production'];
}

export type A2AEnvironmentCheck = { ok: true } | { ok: false; status: number; error: string };

/**
 * Enforces the environment boundary for A2A integration-key sessions, mirroring the
 * canonical rule in `integrationGuard` (guard.ts):
 *  1. A declared `X-Pandora-Environment` header MUST match the key's own environment.
 *  2. The key's environment MUST be in the allowlist.
 *
 * Session-authenticated (non-key) requests carry no environment and are not gated here.
 */
export function enforceA2AEnvironment(
  req: NextRequest | Request,
  clientEnvironment: IntegrationEnvironment | undefined,
  allowed: IntegrationEnvironment[] = allowedA2AEnvironments(),
): A2AEnvironmentCheck {
  if (!clientEnvironment) return { ok: true };

  const declared = req.headers.get('X-Pandora-Environment');
  if (declared && declared !== clientEnvironment) {
    return {
      ok: false,
      status: 400,
      error: `Environment Mismatch: Key is for '${clientEnvironment}' but request declared '${declared}'.`,
    };
  }

  if (!allowed.includes(clientEnvironment)) {
    return {
      ok: false,
      status: 403,
      error: `Environment '${clientEnvironment}' is not authorized for this operation.`,
    };
  }

  return { ok: true };
}
