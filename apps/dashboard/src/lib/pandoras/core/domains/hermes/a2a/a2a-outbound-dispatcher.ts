/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.1 — OUTBOUND DISPATCHER
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/a2a-outbound-dispatcher.ts
 *
 * Dispatches signed, authenticated A2A messages from Hermes OS to Sofía / Media Co.
 * Enforces dual-layer security: Transport HMAC (x-bridge-signature) + Identity EIP-191.
 */

import { A2AMessage, A2AMessageType, A2AProcessingResult } from './contracts';
import { A2ASecurityValidator } from './a2a-security-validator';
import { AgentRegistry } from './agent-registry';
import { HermesIdentitySigner } from '../identity/identity-signer';
import { SafeHttpClient } from '../runtime/egress-guard';

export class A2AOutboundDispatcher {
  /**
   * Dispatches a typed A2A message to Sofía's public Tailscale/Production webhook.
   */
  public static async sendToSofia<T = unknown>(
    type: A2AMessageType,
    payload: T,
    options?: {
      tenantId?: string;
      correlationId?: string;
      expiresInMs?: number;
    }
  ): Promise<A2AProcessingResult> {
    const sofia = AgentRegistry.getAgent('sofia');
    if (!sofia || !sofia.endpoint) {
      throw new Error('[A2AOutboundDispatcher] Sofia endpoint is not configured in AgentRegistry');
    }

    const now = Date.now();
    const messageId = `msg_hermes_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const nonce = `nonce_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date(now).toISOString();
    const expiresAt = options?.expiresInMs
      ? new Date(now + options.expiresInMs).toISOString()
      : new Date(now + 5 * 60 * 1000).toISOString();

    const unsignedMessage: Omit<A2AMessage<T>, 'security'> = {
      protocol: 'pandoras-a2a',
      version: '1.1',
      messageId,
      correlationId: options?.correlationId,
      from: 'hermes',
      to: 'sofia',
      tenantId: options?.tenantId,
      type,
      createdAt,
      expiresAt,
      nonce,
      payload,
    };

    // 1. Calculate Canonical Hash & EIP-191 Identity Signature
    //    FAIL-CLOSED: if Hermes' private identity key is unavailable we refuse to
    //    dispatch rather than silently shipping a 'mock_sig' (which would be
    //    rejected in production anyway).
    const canonicalHash = A2ASecurityValidator.computePayloadCanonicalHash(unsignedMessage as any);
    const signer = new HermesIdentitySigner();
    const signature = await signer.signMessage(canonicalHash);

    // 2. Transport HMAC for security envelope
    const envelopeHmac = A2ASecurityValidator.computeHmac(canonicalHash);

    const fullEnvelope: A2AMessage<T> = {
      ...unsignedMessage,
      security: {
        signature,
        signatureScheme: 'EIP191',
        hmac: envelopeHmac,
      },
    };

    // 3. Compute HTTP Transport HMAC header
    const rawBody = JSON.stringify(fullEnvelope);
    const tsMs = String(now);
    const pathNorm = '/api/v1/sofia/a2a/webhook';
    const transportHmac = A2ASecurityValidator.computeTransportHmac('POST', pathNorm, tsMs, rawBody);

    // 4. Dispatch HTTP Request
    const response = await SafeHttpClient.fetch(sofia.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-a2a-timestamp': tsMs,
        'x-bridge-signature': transportHmac,
      },
      body: rawBody,
    });

    const responseData = await response.json().catch(() => ({}));

    return {
      success: response.ok,
      messageId,
      correlationId: options?.correlationId,
      type,
      payload: responseData,
      error: response.ok
        ? undefined
        : {
            code: `HTTP_${response.status}`,
            message: (responseData as any)?.error || response.statusText || 'A2A dispatch failed',
            detail: responseData,
          },
    };
  }
}
