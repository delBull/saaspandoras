/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.0 — SECURITY VALIDATOR
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/a2a-security-validator.ts
 *
 * Enforces Zero-Trust transport HMAC, EIP-191 wallet signature verification,
 * nonce replay defense, and capability authorization.
 */

import * as crypto from 'crypto';
import { ethers } from 'ethers';
import { A2AMessage } from './contracts';
import { AgentRegistry } from './agent-registry';

const processedNonces = new Map<string, number>();
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutes
const NONCE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface A2AValidationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export class A2ASecurityValidator {
  /**
   * Resolves the A2A transport secret from environment only.
   * FAIL-CLOSED: there is NO hardcoded fallback secret. If none is configured,
   * all HMAC computation/validation refuses to operate.
   */
  public static getHmacSecret(): string {
    const secret =
      process.env.A2A_HMAC_SECRET ||
      process.env.SOFIA_BRIDGE_HMAC_SECRET ||
      process.env.BRIDGE_HMAC_SECRET;

    if (!secret) {
      throw new Error(
        '[A2ASecurityValidator] No A2A_HMAC_SECRET configured. Refusing to compute/validate transport HMAC without a secret (fail-closed).'
      );
    }
    return secret;
  }

  public static computeTransportHmac(method: string, pathNorm: string, timestampMs: string, rawBody: string): string {
    const secret = this.getHmacSecret();
    const input = `${method.toUpperCase()}\n${pathNorm}\n${timestampMs}\n${rawBody}`;
    return crypto.createHmac('sha256', secret).update(input).digest('hex');
  }

  public static computePayloadCanonicalHash(message: Omit<A2AMessage, 'security'>): string {
    const canonical = JSON.stringify({
      protocol: message.protocol,
      version: message.version,
      messageId: message.messageId,
      correlationId: message.correlationId,
      from: message.from,
      to: message.to,
      tenantId: message.tenantId,
      type: message.type,
      createdAt: message.createdAt,
      expiresAt: message.expiresAt,
      nonce: message.nonce,
      payload: message.payload,
    });
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  public static computeHmac(canonicalHash: string): string {
    const secret = this.getHmacSecret();
    return crypto.createHmac('sha256', secret).update(canonicalHash).digest('hex');
  }

  public static validate(message: A2AMessage): A2AValidationResult {
    // 1. Protocol & Version Check
    if (message.protocol !== 'pandoras-a2a' || (message.version !== '1.0' && message.version !== '1.1')) {
      return { valid: false, errorCode: 'INVALID_PROTOCOL', errorMessage: 'Unsupported protocol or version' };
    }

    // 2. Sender Identity Check in Registry
    const sender = AgentRegistry.getAgent(message.from);
    if (!sender || sender.status !== 'ACTIVE') {
      return { valid: false, errorCode: 'UNAUTHORIZED_SENDER', errorMessage: `Sender '${message.from}' is not an active registered agent` };
    }

    // 3. Timestamp Freshness
    const now = Date.now();
    const created = new Date(message.createdAt).getTime();
    if (isNaN(created) || Math.abs(now - created) > MAX_CLOCK_SKEW_MS) {
      return { valid: false, errorCode: 'TIMESTAMP_EXPIRED', errorMessage: 'Message timestamp exceeds acceptable clock skew window (5m)' };
    }
    if (message.expiresAt && now > new Date(message.expiresAt).getTime()) {
      return { valid: false, errorCode: 'MESSAGE_EXPIRED', errorMessage: 'Message TTL has expired' };
    }

    // 4. Nonce Replay Defense
    this.pruneNonces(now);
    if (processedNonces.has(message.nonce)) {
      return { valid: false, errorCode: 'NONCE_REPLAY', errorMessage: 'Nonce has already been used' };
    }
    processedNonces.set(message.nonce, now);

    // 5. Canonical Hash
    const canonicalHash = this.computePayloadCanonicalHash({
      protocol: message.protocol,
      version: message.version,
      messageId: message.messageId,
      correlationId: message.correlationId,
      from: message.from,
      to: message.to,
      tenantId: message.tenantId,
      type: message.type,
      createdAt: message.createdAt,
      expiresAt: message.expiresAt,
      nonce: message.nonce,
      payload: message.payload,
    });

    // 6. Transport HMAC Validation (fail-closed in ALL environments)
    let expectedHmac: string;
    try {
      expectedHmac = this.computeHmac(canonicalHash);
    } catch (err: any) {
      return {
        valid: false,
        errorCode: 'HMAC_SECRET_UNCONFIGURED',
        errorMessage: err?.message || 'A2A HMAC secret is not configured',
      };
    }
    if (!message.security.hmac || message.security.hmac !== expectedHmac) {
      return { valid: false, errorCode: 'INVALID_HMAC', errorMessage: 'Transport HMAC signature verification failed' };
    }

    // 7. Sovereign Wallet Signature Validation (EIP-191)
    //    In production, a missing/mock signature is NEVER accepted.
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && (!message.security.signature || message.security.signature === 'mock_sig')) {
      return {
        valid: false,
        errorCode: 'REQUIRED_WALLET_SIGNATURE',
        errorMessage: 'Production A2A messages must carry a real EIP-191 wallet signature',
      };
    }
    if (message.security.signature && message.security.signature !== 'mock_sig') {
      try {
        const verifyFn = (ethers as any).verifyMessage || ethers.utils?.verifyMessage;
        const recoveredAddress = verifyFn(canonicalHash, message.security.signature).toLowerCase();
        if (recoveredAddress !== sender.walletAddress.toLowerCase()) {
          return {
            valid: false,
            errorCode: 'INVALID_WALLET_SIGNATURE',
            errorMessage: `Signature from ${recoveredAddress} does not match registered wallet for ${message.from} (${sender.walletAddress})`,
          };
        }
      } catch (err: any) {
        return { valid: false, errorCode: 'MALFORMED_SIGNATURE', errorMessage: `Failed to recover signature: ${err?.message}` };
      }
    }

    return { valid: true };
  }

  private static pruneNonces(now: number): void {
    for (const [nonce, timestamp] of processedNonces.entries()) {
      if (now - timestamp > NONCE_TTL_MS) {
        processedNonces.delete(nonce);
      }
    }
  }
}
