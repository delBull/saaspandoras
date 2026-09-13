/**
 * 🏛️ Signed Link Intent Token Service (F4 Protocol)
 * apps/dashboard/src/lib/identity/link-intent-token.ts
 *
 * Implements ephemeral, cryptographic, single-use binding tokens for Telegram Concierge.
 * Security Invariant: Deep links never transport authority; they transport verifiable intent.
 */

import crypto from 'crypto';

export interface LinkIntentPayload {
  wallet: string;
  tenant: string;
  nonce: string;
  exp: number; // Unix timestamp in ms
}

const LINK_SECRET = process.env.HERMES_EDGE_SECRET || process.env.HERMES_WEBHOOK_SECRET || process.env.PANDORAS_SECRET_KEY || 'pandoras_canonical_link_secret';

export class LinkIntentService {
  /**
   * Generates a tamper-evident HMAC-SHA256 signed opaque token.
   * Default lifespan: 15 minutes.
   */
  static generateToken(params: { wallet: string; tenant: string; ttlSeconds?: number }): {
    token: string;
    expiresAt: Date;
  } {
    const ttlMs = (params.ttlSeconds || 900) * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);
    const nonce = crypto.randomUUID();

    const payload: LinkIntentPayload = {
      wallet: params.wallet.trim().toLowerCase(),
      tenant: params.tenant.trim().toLowerCase(),
      nonce,
      exp: expiresAt.getTime(),
    };

    const payloadStr = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', LINK_SECRET);
    hmac.update(payloadStr);
    const signature = hmac.digest('hex');

    const combined = JSON.stringify({ payload, sig: signature });
    const token = Buffer.from(combined).toString('base64url');

    return { token, expiresAt };
  }

  // Ephemeral in-memory registry of consumed nonces with expiration for atomic single-use
  private static consumedNonces: Map<string, number> = new Map();

  /**
   * Periodically cleans up expired nonces to prevent unbounded memory growth.
   */
  private static cleanupExpiredNonces(): void {
    const now = Date.now();
    for (const [nonce, exp] of this.consumedNonces.entries()) {
      if (now > exp) {
        this.consumedNonces.delete(nonce);
      }
    }
  }

  /**
   * Verifies and decodes a signed link intent token (read-only verification).
   * Fail-closed: returns null if signature is invalid or token has expired.
   */
  static verifyToken(token: string): LinkIntentPayload | null {
    if (!token || typeof token !== 'string') return null;

    try {
      const decodedStr = Buffer.from(token, 'base64url').toString('utf8');
      const { payload, sig } = JSON.parse(decodedStr);

      if (!payload || !sig || !payload.wallet || !payload.tenant || !payload.exp || !payload.nonce) {
        return null;
      }

      // 1. Check expiration
      if (Date.now() > Number(payload.exp)) {
        console.warn(`[LinkIntentService] Token expired at ${new Date(payload.exp).toISOString()}`);
        return null;
      }

      // 2. Validate cryptographic signature
      const expectedHmac = crypto.createHmac('sha256', LINK_SECRET);
      expectedHmac.update(JSON.stringify(payload));
      const expectedSignature = expectedHmac.digest('hex');

      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(sig, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isSignatureValid) {
        console.warn('[LinkIntentService] Cryptographic signature mismatch on link intent token.');
        return null;
      }

      return payload as LinkIntentPayload;
    } catch (err) {
      console.warn('[LinkIntentService] Failed to parse or verify token:', err);
      return null;
    }
  }

  /**
   * Atomically verifies AND consumes a signed link intent token.
   * Enforces strict single-use (anti-replay and concurrency race prevention).
   * Returns payload on first consumption; subsequent calls with same nonce return null.
   */
  static consumeToken(token: string): LinkIntentPayload | null {
    this.cleanupExpiredNonces();

    const payload = this.verifyToken(token);
    if (!payload) return null;

    // Atomic claim check
    if (this.consumedNonces.has(payload.nonce)) {
      console.warn(`[LinkIntentService] Replay or concurrent consumption detected for nonce: ${payload.nonce}`);
      return null;
    }

    // Atomically claim the nonce
    this.consumedNonces.set(payload.nonce, payload.exp);
    return payload;
  }
}
