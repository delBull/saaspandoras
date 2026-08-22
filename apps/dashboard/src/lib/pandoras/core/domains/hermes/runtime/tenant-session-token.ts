/**
 * 🛡️ Hermes OS — Control Plane Tenant Session Token Signer (K22-RLS-01)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/tenant-session-token.ts
 *
 * Issues cryptographic HMAC-SHA256 session tokens from the Control Plane to bind
 * the Hermes database connection strictly to a single tenant and actor.
 * Prevents arbitrary `SET app.current_org` spoofing in a compromised runtime.
 */

import crypto from 'crypto';

export interface TenantSessionTokenPayload {
  tenantId: string;
  actorId?: string;
  expiresAt: number; // Unix timestamp in seconds
  nonce: string;
}

export interface SignedTenantSessionToken {
  tenantId: string;
  actorId: string;
  expiresAt: number;
  nonce: string;
  signature: string;
}

export class TenantSessionTokenSigner {
  private secret: string;

  constructor(secret?: string) {
    if (secret) {
      this.secret = secret;
    } else {
      const envSecret = process.env.HERMES_DB_SESSION_SECRET || process.env.JWT_SECRET;
      if (!envSecret) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('[TenantSessionTokenSigner] HERMES_DB_SESSION_SECRET is required in production. Failing closed.');
        }
        this.secret = 'pandoras_hermes_dev_ephemeral_db_session_secret_32bytes!';
      } else {
        this.secret = envSecret;
      }
    }
  }

  /**
   * Generates a signed session token for a given tenant and actor.
   * Default TTL: 15 minutes (900 seconds).
   */
  public generateToken(
    tenantId: string,
    actorId = 'anonymous_actor',
    ttlSeconds = 900
  ): SignedTenantSessionToken {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const nonce = crypto.randomBytes(8).toString('hex');
    const message = `${tenantId}:${actorId}:${expiresAt}:${nonce}`;
    const signature = crypto.createHmac('sha256', this.secret).update(message).digest('hex');

    return {
      tenantId,
      actorId,
      expiresAt,
      nonce,
      signature
    };
  }

  /**
   * Validates a signed session token locally (fail-closed).
   */
  public verifyToken(token: SignedTenantSessionToken): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (token.expiresAt < now) {
      return false; // Expired
    }

    const message = `${token.tenantId}:${token.actorId}:${token.expiresAt}:${token.nonce}`;
    const expectedSignature = crypto.createHmac('sha256', this.secret).update(message).digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(token.signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }
}
