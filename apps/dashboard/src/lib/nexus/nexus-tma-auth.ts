/**
 * 🔐 Nexus TMA Auth Engine — Phase F2
 * apps/dashboard/src/lib/nexus/nexus-tma-auth.ts
 *
 * Identity Resolution Chain:
 *   Telegram initData
 *     → HMAC Verification (TELEGRAM_TEAM_BOT_TOKEN)
 *     → Extract telegramUserId
 *     → Lookup nexus_collaborators.telegramUserId
 *     → Verify ACTIVE status + not expired
 *     → resolveEffectivePermissions(role, overrides)
 *     → Derive TMA capabilities[]
 *     → Return NexusTmaSession
 *
 * Invariants:
 *  - NEVER issues a session if HMAC verification fails.
 *  - NEVER issues a session if collaborator is missing, INACTIVE, or expired.
 *  - Capabilities are purely derived from RBAC — not from Telegram identity.
 *  - telegramUserId is a channel binding ONLY; authority comes from nexus_collaborators.role.
 *  - All auth errors are thrown (fail-closed); callers handle HTTP status codes.
 */

import { createHmac } from 'crypto';
import { db } from '@/db';
import { nexusCollaborators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolveEffectivePermissions, type NexusRole } from '@/lib/nexus/nexus-rbac';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TmaCapability = keyof {
  'users.manage': true;
  'tenants.manage': true;
  'finance.manage': true;
  'growth.manage': true;
  'marketing.manage': true;
  'nexus.manage': true;
  'compliance.manage': true;
  'calendar.manage': true;
  'ecosystem': true;
};

export interface NexusTmaSession {
  collaboratorId: number;
  name: string;
  role: NexusRole;
  telegramUserId: string;
  telegramUsername?: string;
  capabilities: TmaCapability[];
  organizationId: null; // Single-tenant: no org scope in F2; F5 will add per-action scope
  issuedAt: number;
  expiresAt: number; // unix ms — 8h TTL
}

export interface TelegramInitDataUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

// ─── Auth Errors (fail-closed, all throw) ────────────────────────────────────

export class NexusTmaAuthError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode: number) {
    super(message);
    this.name = 'NexusTmaAuthError';
  }
}

export class NexusTmaHmacError extends NexusTmaAuthError {
  constructor() {
    super('Telegram initData HMAC verification failed.', 'INVALID_INIT_DATA_HMAC', 401);
  }
}

export class NexusTmaExpiredError extends NexusTmaAuthError {
  constructor(ageSeconds: number) {
    super(`Telegram initData expired (${ageSeconds}s old, max ${MAX_INIT_DATA_AGE_SECONDS}s).`, 'EXPIRED_INIT_DATA', 401);
  }
}

export class NexusTmaNotLinkedError extends NexusTmaAuthError {
  constructor(telegramUserId: string) {
    super(
      `Telegram user ${telegramUserId} is not linked to any Nexus collaborator account.`,
      'TELEGRAM_NOT_LINKED',
      403
    );
  }
}

export class NexusTmaCollaboratorInactiveError extends NexusTmaAuthError {
  constructor(collaboratorId: number, status: string) {
    super(
      `Nexus collaborator #${collaboratorId} is not ACTIVE (status: ${status}). Access denied.`,
      'COLLABORATOR_INACTIVE',
      403
    );
  }
}

export class NexusTmaCollaboratorExpiredError extends NexusTmaAuthError {
  constructor(collaboratorId: number) {
    super(
      `Nexus collaborator #${collaboratorId} access has expired. Renew the invitation.`,
      'COLLABORATOR_EXPIRED',
      403
    );
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum age of Telegram initData before it's considered stale (24h per Telegram spec). */
const MAX_INIT_DATA_AGE_SECONDS = 86_400;

/** Session TTL for the NexusTmaSession object (8 hours). */
const SESSION_TTL_MS = 8 * 60 * 60 * 1_000;

// ─── HMAC Verification ───────────────────────────────────────────────────────

/**
 * Verifies the Telegram WebApp initData HMAC.
 *
 * Algorithm (Telegram spec):
 *  1. Parse initData as URLSearchParams.
 *  2. Extract and remove the `hash` field.
 *  3. Sort remaining fields alphabetically.
 *  4. Join as "key=value\n" pairs (no trailing newline).
 *  5. Derive the secret key: HMAC-SHA256("WebAppData", botToken).
 *  6. Compute HMAC-SHA256(secret, dataCheckString).
 *  7. Compare hex digest to `hash` (constant-time).
 *
 * Returns the parsed URLSearchParams if valid; throws NexusTmaHmacError if invalid.
 */
export function verifyTelegramInitData(
  rawInitData: string,
  botToken?: string
): URLSearchParams {
  const token = (botToken ?? process.env.TELEGRAM_TEAM_BOT_TOKEN ?? '').trim();
  if (!token) {
    throw new NexusTmaAuthError(
      'TELEGRAM_TEAM_BOT_TOKEN is not configured.',
      'TRANSPORT_NOT_CONFIGURED',
      500
    );
  }

  const params = new URLSearchParams(rawInitData);
  const receivedHash = params.get('hash');
  if (!receivedHash) {
    throw new NexusTmaHmacError();
  }

  // Build the data-check string per Telegram spec
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  // Derive secret key: HMAC-SHA256("WebAppData", botToken)
  const secretKey = createHmac('sha256', 'WebAppData').update(token).digest();

  // Compute expected hash
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Constant-time comparison
  if (receivedHash.length !== expectedHash.length) {
    throw new NexusTmaHmacError();
  }
  let mismatch = 0;
  for (let i = 0; i < receivedHash.length; i++) {
    mismatch |= receivedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  if (mismatch !== 0) {
    throw new NexusTmaHmacError();
  }

  return params;
}

/**
 * Validates the `auth_date` field from initData is not older than MAX_INIT_DATA_AGE_SECONDS.
 */
export function validateInitDataAge(params: URLSearchParams): void {
  const authDateStr = params.get('auth_date');
  if (!authDateStr) {
    throw new NexusTmaAuthError('auth_date missing from initData.', 'MISSING_AUTH_DATE', 401);
  }
  const authDate = parseInt(authDateStr, 10);
  const nowSeconds = Math.floor(Date.now() / 1_000);
  const ageSeconds = nowSeconds - authDate;
  if (ageSeconds > MAX_INIT_DATA_AGE_SECONDS) {
    throw new NexusTmaExpiredError(ageSeconds);
  }
}

/**
 * Extracts the Telegram user object from initData params.
 */
export function extractTelegramUser(params: URLSearchParams): TelegramInitDataUser {
  const userStr = params.get('user');
  if (!userStr) {
    throw new NexusTmaAuthError('user field missing from initData.', 'MISSING_USER', 401);
  }
  try {
    return JSON.parse(userStr) as TelegramInitDataUser;
  } catch {
    throw new NexusTmaAuthError('Failed to parse user field from initData.', 'INVALID_USER', 401);
  }
}

// ─── Capability Derivation ────────────────────────────────────────────────────

/**
 * Derives the TMA capabilities array from resolved NexusPermissions.
 * Only permissions explicitly set to `true` are included.
 */
export function deriveCapabilities(
  role: NexusRole,
  overrides?: Record<string, boolean> | null
): TmaCapability[] {
  const perms = resolveEffectivePermissions(role, overrides);
  return (Object.entries(perms) as [TmaCapability, boolean | undefined][])
    .filter(([, value]) => value === true)
    .map(([key]) => key);
}

// ─── Main Auth Resolver ───────────────────────────────────────────────────────

/**
 * Full Nexus TMA Auth resolution.
 *
 * Input: raw Telegram initData string from window.Telegram.WebApp.initData
 * Output: NexusTmaSession (collaborator ID, role, capabilities, TTL)
 *
 * This function is the single entry point for ALL Nexus TMA authentication.
 * It is called by POST /api/integrations/telegram/team/auth.
 */
export async function resolveNexusTmaSession(rawInitData: string): Promise<NexusTmaSession> {
  // Step 1: Verify HMAC (throws on failure)
  const params = verifyTelegramInitData(rawInitData);

  // Step 2: Validate age (throws on expiry)
  validateInitDataAge(params);

  // Step 3: Extract Telegram user
  const telegramUser = extractTelegramUser(params);
  const telegramUserId = String(telegramUser.id);

  // Step 4: Lookup nexus_collaborators by telegramUserId
  const collaborator = await db.query.nexusCollaborators.findFirst({
    where: eq(nexusCollaborators.telegramUserId, telegramUserId),
  });

  if (!collaborator) {
    throw new NexusTmaNotLinkedError(telegramUserId);
  }

  // Step 5: Verify ACTIVE status
  if (collaborator.status !== 'ACTIVE') {
    throw new NexusTmaCollaboratorInactiveError(collaborator.id, collaborator.status);
  }

  // Step 6: Verify not expired
  const now = new Date();
  if (collaborator.expiresAt < now) {
    throw new NexusTmaCollaboratorExpiredError(collaborator.id);
  }

  // Step 7: Resolve capabilities (role + overrides)
  const role = collaborator.role as NexusRole;
  const capabilities = deriveCapabilities(role, collaborator.permissions as Record<string, boolean> | null);

  // Step 8: Build session
  const issuedAt = Date.now();
  return {
    collaboratorId: collaborator.id,
    name: collaborator.name,
    role,
    telegramUserId,
    telegramUsername: telegramUser.username ?? collaborator.telegramUsername ?? undefined,
    capabilities,
    organizationId: null,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_MS,
  };
}
