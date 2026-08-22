/**
 * 🏛️ Hermes OS — Milestone 6.0: K23 Hermes Cryptographic Identity Signer
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/identity/identity-signer.ts
 *
 * Signs EIP-712 Action Intents on behalf of a specific Hermes Instance Identity.
 * Decoupled from private key storage (can use local private key or external KMS/HSM).
 */

import { privateKeyToAccount } from 'viem/accounts';
import type { PrivateKeyAccount } from 'viem/accounts';
import crypto from 'crypto';
import { 
  HermesActionIntent, 
  SignedHermesActionIntent, 
  HERMES_EIP712_DOMAIN, 
  HERMES_EIP712_TYPES 
} from './contracts';

export class HermesIdentitySigner {
  private account: PrivateKeyAccount;

  constructor(privateKeyHex?: string) {
    let key = privateKeyHex || process.env.HERMES_IDENTITY_PRIVATE_KEY;
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[HermesIdentitySigner] HERMES_IDENTITY_PRIVATE_KEY is required in production.');
      }
      // Deterministic dev/testing key
      key = '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f360fe2';
    }
    if (!key.startsWith('0x')) {
      key = `0x${key}`;
    }
    this.account = privateKeyToAccount(key as `0x${string}`);
  }

  public getPublicAddress(): string {
    return this.account.address;
  }

  public get publicAddress(): string {
    return this.account.address;
  }

  /**
   * Signs an EIP-712 Action Intent.
   */
  public async signIntent(
    params: Omit<HermesActionIntent, 'hermesAddress' | 'timestamp' | 'nonce'> & {
      nonce?: string;
      timestamp?: number;
    }
  ): Promise<SignedHermesActionIntent> {
    const intent: HermesActionIntent = {
      hermesAddress: this.account.address,
      tenantId: params.tenantId,
      actorId: params.actorId,
      actionName: params.actionName,
      resourceId: params.resourceId,
      policyHash: params.policyHash,
      timestamp: params.timestamp ?? Math.floor(Date.now() / 1000),
      nonce: params.nonce ?? crypto.randomBytes(16).toString('hex'),
    };

    const signature = await this.account.signTypedData({
      domain: HERMES_EIP712_DOMAIN,
      types: HERMES_EIP712_TYPES,
      primaryType: 'HermesActionIntent',
      message: {
        hermesAddress: intent.hermesAddress as `0x${string}`,
        tenantId: intent.tenantId,
        actorId: intent.actorId,
        actionName: intent.actionName,
        resourceId: intent.resourceId,
        policyHash: intent.policyHash,
        timestamp: BigInt(intent.timestamp),
        nonce: intent.nonce,
      },
    });

    return {
      intent,
      signature,
    };
  }
}
