/**
 * Hermes OS — Telegram Identity Bridge Types & Session Contracts
 * 
 * Invariants:
 * 1. organizationId (UUID) is the SOLE authority boundary.
 * 2. tenantSlug and projectId are UX/legacy derived fields, NEVER used for authorization decisions.
 * 3. actorId is always scoped alongside organizationId for data isolation.
 * 4. Global admin role acts as PLATFORM AUTHORITY across all workspaces.
 */

export type HermesRole = 'OWNER' | 'ADMIN' | 'OPERATOR';

export interface TelegramAuthIdentity {
  telegramUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  authDate: number;
  hash: string;
}

export interface AuthorizedTenant {
  organizationId: string; // Canonical UUID
  organizationName: string;
  tenantSlug?: string;
  projectId?: number;
  role: HermesRole;
  isOwner: boolean;
}

export interface HermesSession {
  subject: {
    telegramUserId: string;
    username?: string;
    internalUserId?: string;
    walletAddress?: string;
  };
  tenant: {
    organizationId: string; // Canonical UUID authority boundary
    organizationName: string;
    tenantSlug?: string;
    projectId?: number;
  };
  actorId: string;          // Scoped internal actor (e.g. "usr_123" or "tg_456")
  role: HermesRole;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  source: 'TELEGRAM';
}

export interface HermesTokenPayload {
  sub: string;               // actorId
  telegramUserId: string;
  organizationId: string;    // Canonical UUID
  role: HermesRole;
  sessionId: string;
  source: 'TELEGRAM';
  iat: number;
  exp: number;
}

export class HermesAuthError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode: number = 401) {
    super(message);
    this.name = 'HermesAuthError';
  }
}

export class HermesTenantAccessDeniedError extends HermesAuthError {
  constructor(organizationId: string, telegramUserId: string) {
    super(
      `Access denied: Telegram user '${telegramUserId}' is not authorized to operate tenant '${organizationId}'.`,
      'TENANT_ACCESS_DENIED',
      403
    );
    this.name = 'HermesTenantAccessDeniedError';
  }
}

export class HermesInvalidInitDataError extends HermesAuthError {
  constructor(reason: string) {
    super(`Invalid Telegram initData: ${reason}`, 'INVALID_INIT_DATA', 401);
    this.name = 'HermesInvalidInitDataError';
  }
}

export class HermesExpiredInitDataError extends HermesAuthError {
  constructor(ageSeconds: number) {
    super(`Telegram initData expired (${ageSeconds}s old, max 86400s allowed).`, 'EXPIRED_INIT_DATA', 401);
    this.name = 'HermesExpiredInitDataError';
  }
}
