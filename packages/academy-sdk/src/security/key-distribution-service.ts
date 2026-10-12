/**
 * 🔑 Pandora's Academy — Key Distribution Service (Phase 2)
 * packages/academy-sdk/src/security/key-distribution-service.ts
 *
 * Implements Server-Authoritative Key Distribution for Encrypted Resources:
 * 1. Validates cryptographic signature (SIWE / EIP-712 challenge) with nonce and expiration.
 * 2. Enforces anti-replay protection (consumed nonces are marked or verified).
 * 3. Evaluates Access Policy (Token ownership, whitelist, candidate enrollment).
 * 4. Unwraps resource DEK server-side using KEK and delivers it securely.
 * 5. Does NOT leak plaintext content, KEK or student PII.
 */

import { ethers } from 'ethers';
import { EncryptedCourseResourceManifest } from '../types';
import { EncryptedCourseResourceVault } from './encrypted-resource-vault';

export interface KeyChallengeRequest {
  walletAddress: string;
  resourceId: string;
  tenantId: string;
  programId: string;
  nonce: string;
  timestamp: number; // Unix milliseconds
  signature: string;
}

export interface KeyAccessPolicy {
  isAllowed(context: {
    walletAddress: string;
    tenantId: string;
    programId: string;
    resourceId: string;
  }): Promise<boolean>;
}

export interface KeyChallengeVerificationResult {
  allowed: boolean;
  reason?: string;
  unwrappedDekBase64?: string;
  resourceId?: string;
}

/**
 * Pluggable anti-replay store. registerNonce MUST be atomic (true = consumed,
 * false = replay/duplicate or expired). Persisted implementations (e.g. Redis
 * SET NX) are REQUIRED for multi-instance serverless deployments.
 */
export interface NonceStore {
  registerNonce(nonce: string, timestamp: number): boolean | Promise<boolean>;
}

export class InMemoryNonceStore implements NonceStore {
  private usedNonces = new Map<string, number>();
  private readonly maxAgeMs: number;

  constructor(maxAgeMs = 5 * 60 * 1000) {
    this.maxAgeMs = maxAgeMs; // 5 minutes validity
  }

  public registerNonce(nonce: string, timestamp: number): boolean {
    const now = Date.now();
    // 1. Verify timestamp freshness
    if (Math.abs(now - timestamp) > this.maxAgeMs) {
      return false; // Stale or futuristic timestamp
    }

    // 2. Anti-replay
    if (this.usedNonces.has(nonce)) {
      return false; // Replay attack detected
    }

    this.usedNonces.set(nonce, timestamp);
    this.cleanupOldNonces();
    return true;
  }

  private cleanupOldNonces() {
    const threshold = Date.now() - this.maxAgeMs;
    for (const [nonce, ts] of this.usedNonces.entries()) {
      if (ts < threshold) {
        this.usedNonces.delete(nonce);
      }
    }
  }
}

/**
 * 🛡️ Fase 2.1: Signature MUST be validated BEFORE consuming the nonce, so a
 * failed signature (or a probing attacker) can never DoS-burn a victim's nonce.
 * (This invariant is enforced inside authorizeAndDeliverKey below.)
 */

/**
 * 📦 Fase 2.1: server-side manifest registry. The key endpoint NEVER accepts
 * manifests from the request body — manifests are loaded by resourceId from
 * the trusted store (client-controlled crypto material is never unwrapped).
 */
export interface AcademyManifestStore {
  getByResourceId(resourceId: string): Promise<EncryptedCourseResourceManifest | null>;
}

export class InMemoryAcademyManifestStore implements AcademyManifestStore {
  private manifests = new Map<string, EncryptedCourseResourceManifest>();

  public register(manifest: EncryptedCourseResourceManifest): void {
    this.manifests.set(manifest.resourceId, manifest);
  }

  public async getByResourceId(resourceId: string): Promise<EncryptedCourseResourceManifest | null> {
    return this.manifests.get(resourceId) || null;
  }
}

export class KeyDistributionService {
  private vault: EncryptedCourseResourceVault;
  private nonceStore: NonceStore;
  private accessPolicy: KeyAccessPolicy;

  constructor(
    vault: EncryptedCourseResourceVault,
    accessPolicy: KeyAccessPolicy,
    nonceStore?: NonceStore
  ) {
    this.vault = vault;
    this.accessPolicy = accessPolicy;
    this.nonceStore = nonceStore || new InMemoryNonceStore();
  }

  /**
   * Constructs the deterministic challenge string that the student's wallet must sign.
   */
  public static buildChallengeMessage(params: {
    walletAddress: string;
    resourceId: string;
    tenantId: string;
    programId: string;
    nonce: string;
    timestamp: number;
  }): string {
    return [
      "PANDORA'S ACADEMY — ENCRYPTED CONTENT ACCESS CHALLENGE",
      `Wallet: ${params.walletAddress.toLowerCase()}`,
      `Resource: ${params.resourceId}`,
      `Tenant: ${params.tenantId}`,
      `Program: ${params.programId}`,
      `Nonce: ${params.nonce}`,
      `Timestamp: ${params.timestamp}`,
      "Notice: Sign this message to unlock the private lesson in memory. No blockchain transaction or gas fee required."
    ].join('\n');
  }

  /**
   * Verifies the request and safely releases the unwrapped DEK.
   */
  public async authorizeAndDeliverKey(
    challenge: KeyChallengeRequest,
    manifest: EncryptedCourseResourceManifest
  ): Promise<KeyChallengeVerificationResult> {
    // 1. Validate resource binding
    if (
      challenge.resourceId !== manifest.resourceId ||
      challenge.tenantId !== manifest.tenantId ||
      challenge.programId !== manifest.programId
    ) {
      return { allowed: false, reason: 'Challenge parameters do not match resource manifest.' };
    }

    // 2. 🔑 Signature Verification (EIP-191) — BEFORE nonce consumption (Fase 2.1):
    // a bad/forged signature must never burn the (possibly victim's) nonce.
    const expectedMessage = KeyDistributionService.buildChallengeMessage(challenge);
    let recoveredAddress: string;
    try {
      const ethersAny = ethers as any;
      const verifyFn = ethersAny.utils?.verifyMessage || ethersAny.verifyMessage;
      recoveredAddress = verifyFn(expectedMessage, challenge.signature);
    } catch {
      return { allowed: false, reason: 'Cryptographic signature verification failed.' };
    }

    if (recoveredAddress.toLowerCase() !== challenge.walletAddress.toLowerCase()) {
      return { allowed: false, reason: 'Recovered signer address does not match requested wallet.' };
    }

    // 3. Nonce & Anti-Replay Verification (signature-backed consumption)
    const nonceResult = await Promise.resolve(
      this.nonceStore.registerNonce(challenge.nonce, challenge.timestamp)
    );
    if (!nonceResult) {
      return { allowed: false, reason: 'Nonce is expired or has already been used (replay protection).' };
    }

    // 4. Access Policy Evaluation (Whitelist / Token Gate / Enrollment)
    const hasAccess = await this.accessPolicy.isAllowed({
      walletAddress: challenge.walletAddress.toLowerCase(),
      tenantId: challenge.tenantId,
      programId: challenge.programId,
      resourceId: challenge.resourceId,
    });

    if (!hasAccess) {
      return { allowed: false, reason: 'Access policy denied: Wallet does not hold access entitlement.' };
    }

    // 5. Unwrap DEK using KEK provider
    try {
      const dekBuffer = await this.vault.unwrapDek(manifest);
      const unwrappedDekBase64 = dekBuffer.toString('base64');
      // Zeroize local buffer
      dekBuffer.fill(0);

      return {
        allowed: true,
        resourceId: manifest.resourceId,
        unwrappedDekBase64,
      };
    } catch {
      return { allowed: false, reason: 'Cryptographic error during DEK unwrap.' };
    }
  }
}
