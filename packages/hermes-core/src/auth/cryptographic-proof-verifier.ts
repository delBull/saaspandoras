/**
 * 🛡️ Cryptographic Proof Verifiers — Gate 2 (Channel-Isolated Verification)
 * packages/hermes-core/src/auth/cryptographic-proof-verifier.ts
 *
 * Implements strict mathematical verification per provider without permissive fallbacks.
 * Reuses existing canonical systems:
 * 1. verifyTelegramInitData: Reuses TelegramAuthValidator.validateInitData (single source of truth).
 * 2. verifyTelegramWebhookSecret: timingSafeEqual on X-Telegram-Bot-Api-Secret-Token.
 * 3. verifyEthereumSiwe: ERC-4361 regex parsing, domain, chainId, expiration validation and EIP-191 address recovery via ethers.
 * 4. verifyWhatsAppCloudWebhook: HMAC-SHA256 over raw request buffer with Meta App Secret.
 * 5. verifyInternalServiceSecret: timingSafeEqual on HERMES_INTERNAL_SERVICE_SECRET.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { ethers } from 'ethers';
import { TelegramAuthValidator } from './telegram-auth-validator';
import type { ActorBindingProof } from '../runtime/prompt-hygiene-contract';

export interface ParsedSiweMessage {
  domain?: string;
  address: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: number;
  nonce?: string;
  issuedAt?: Date;
  expirationTime?: Date;
  notBefore?: Date;
  requestId?: string;
}

export function parseSiweMessage(message: string): ParsedSiweMessage | null {
  if (!message || typeof message !== 'string') return null;

  const lines = message.split(/\r?\n/);
  const firstLine = lines[0];
  if (!firstLine) return null;

  const headerMatch = firstLine.match(
    /^(?:https?:\/\/)?([a-zA-Z0-9.-]+(?::[0-9]+)?)\s+wants you to sign in with your Ethereum account:$/i
  );

  let domain: string | undefined;
  let addressLine = '';
  let startIndex = 1;

  if (headerMatch && headerMatch[1]) {
    domain = headerMatch[1].trim();
    addressLine = (lines[1] || '').trim();
    startIndex = 2;
  } else if (/^0x[a-fA-F0-9]{40}$/i.test(firstLine.trim())) {
    domain = undefined;
    addressLine = firstLine.trim();
    startIndex = 1;
  } else {
    return null;
  }

  if (!/^0x[a-fA-F0-9]{40}$/i.test(addressLine)) {
    return null;
  }
  const address = addressLine.toLowerCase();

  const result: ParsedSiweMessage = { domain, address };

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();
    if (!line) continue;

    const uriMatch = line.match(/^URI:\s*(.+)$/i);
    if (uriMatch?.[1]) {
      result.uri = uriMatch[1].trim();
      continue;
    }

    const versionMatch = line.match(/^Version:\s*(.+)$/i);
    if (versionMatch?.[1]) {
      result.version = versionMatch[1].trim();
      continue;
    }

    const chainMatch = line.match(/^Chain ID:\s*([0-9]+)$/i);
    if (chainMatch?.[1]) {
      result.chainId = parseInt(chainMatch[1].trim(), 10);
      continue;
    }

    const nonceMatch = line.match(/^Nonce:\s*([a-zA-Z0-9]+)$/i);
    if (nonceMatch?.[1]) {
      result.nonce = nonceMatch[1].trim();
      continue;
    }

    const issuedAtMatch = line.match(/^Issued At:\s*(.+)$/i);
    if (issuedAtMatch?.[1]) {
      const d = new Date(issuedAtMatch[1].trim());
      if (!isNaN(d.getTime())) result.issuedAt = d;
      continue;
    }

    const expMatch = line.match(/^Expiration Time:\s*(.+)$/i);
    if (expMatch?.[1]) {
      const d = new Date(expMatch[1].trim());
      if (!isNaN(d.getTime())) result.expirationTime = d;
      continue;
    }

    const notBeforeMatch = line.match(/^Not Before:\s*(.+)$/i);
    if (notBeforeMatch?.[1]) {
      const d = new Date(notBeforeMatch[1].trim());
      if (!isNaN(d.getTime())) result.notBefore = d;
      continue;
    }

    const reqIdMatch = line.match(/^Request ID:\s*(.+)$/i);
    if (reqIdMatch?.[1]) {
      result.requestId = reqIdMatch[1].trim();
      continue;
    }
  }

  return result;
}

export class CryptographicProofVerifier {
  /**
   * Telegram WebApp initData verification.
   * Delegates directly to canonical TelegramAuthValidator.validateInitData.
   * Asserts actorId strictly matches the authenticated telegram user.
   */
  public static verifyTelegramInitData(
    proof: ActorBindingProof,
    botToken: string,
    options?: { maxAgeSeconds?: number }
  ): { valid: boolean; error?: string } {
    const rawData = proof.rawInitData || proof.proofSignature;
    if (!rawData || !botToken) {
      return { valid: false, error: 'MISSING_INIT_DATA_OR_BOT_TOKEN' };
    }

    try {
      const validator = new TelegramAuthValidator({
        botToken,
        maxAgeSeconds: options?.maxAgeSeconds ?? 86400,
      });
      const identity = validator.validateInitData(rawData, botToken);

      // Validate actor binding
      const expectedActor = identity.telegramUserId;
      if (proof.actorId !== expectedActor && proof.actorId !== `tg_${expectedActor}`) {
        return { valid: false, error: 'ACTOR_MISMATCH_WITH_TELEGRAM_USER' };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err?.message || 'INVALID_TELEGRAM_INIT_DATA' };
    }
  }

  /**
   * Telegram Bot Webhook Secret Token verification.
   * Compares the X-Telegram-Bot-Api-Secret-Token with the configured bot webhook secret.
   */
  public static verifyTelegramWebhookSecret(
    proof: ActorBindingProof,
    expectedSecret: string
  ): { valid: boolean; error?: string } {
    const token = proof.secretToken || proof.proofSignature;
    if (!token || !expectedSecret) {
      return { valid: false, error: 'MISSING_SECRET_TOKEN' };
    }

    const bufReceived = Buffer.from(token, 'utf8');
    const bufExpected = Buffer.from(expectedSecret, 'utf8');

    if (bufReceived.length !== bufExpected.length || !timingSafeEqual(bufReceived, bufExpected)) {
      return { valid: false, error: 'INVALID_WEBHOOK_SECRET_TOKEN' };
    }

    return { valid: true };
  }

  /**
   * Ethereum SIWE (ERC-4361) Signature & Statement Verification.
   * Enforces domain anti-phishing, chain ID, expiration, actor address binding,
   * nonce validation, and cryptographic signature recovery via ethers.utils.verifyMessage.
   */
  public static verifyEthereumSiwe(
    proof: ActorBindingProof,
    options?: { expectedDomain?: string; expectedChainId?: number }
  ): { valid: boolean; error?: string; recoveredAddress?: string } {
    const message = proof.siweMessage;
    const signature = proof.proofSignature;

    if (!message || !signature) {
      return { valid: false, error: 'MISSING_SIWE_MESSAGE_OR_SIGNATURE' };
    }

    const parsed = parseSiweMessage(message);
    if (!parsed) {
      return { valid: false, error: 'INVALID_SIWE_MESSAGE_FORMAT' };
    }

    const expectedActorAddress = proof.actorId.toLowerCase().replace(/^wallet_/, '');

    // 1. Validate Domain Binding (Anti-Phishing)
    // Fail-closed: when a domain policy is configured, the message MUST declare that
    // exact domain. A message with no domain line is rejected, not skipped.
    const requiredDomain = options?.expectedDomain || proof.expectedDomain;
    if (requiredDomain && (!parsed.domain || parsed.domain.toLowerCase() !== requiredDomain.toLowerCase())) {
      return { valid: false, error: 'SIWE_DOMAIN_MISMATCH' };
    }

    // 2. Validate Chain ID Binding
    const requiredChainId = options?.expectedChainId ?? proof.expectedChainId;
    if (requiredChainId !== undefined && parsed.chainId !== requiredChainId) {
      return { valid: false, error: 'SIWE_CHAIN_ID_MISMATCH' };
    }

    // 3. Validate Expiration Time (Fail-Closed)
    if (parsed.expirationTime) {
      if (parsed.expirationTime.getTime() <= Date.now()) {
        return { valid: false, error: 'SIWE_MESSAGE_EXPIRED' };
      }
    }

    // 4. Validate Not Before (Fail-Closed)
    if (parsed.notBefore) {
      if (parsed.notBefore.getTime() > Date.now()) {
        return { valid: false, error: 'SIWE_MESSAGE_NOT_YET_VALID' };
      }
    }

    // 5. Validate Actor Binding
    if (parsed.address !== expectedActorAddress) {
      return { valid: false, error: 'ACTOR_MISMATCH_WITH_DECLARED_SIWE_ADDRESS' };
    }

    // 6. Validate Nonce Binding
    if (!parsed.nonce || parsed.nonce !== proof.nonce) {
      return { valid: false, error: 'SIWE_NONCE_MISMATCH' };
    }

    // 7. Cryptographic recovery via ethers.utils.verifyMessage
    try {
      const recoveredSigner = ethers.utils.verifyMessage(message, signature).toLowerCase();
      if (recoveredSigner !== parsed.address) {
        return { valid: false, error: 'INVALID_CRYPTOGRAPHIC_SIGNATURE' };
      }

      return { valid: true, recoveredAddress: recoveredSigner };
    } catch (err: any) {
      return { valid: false, error: `SIGNATURE_VERIFICATION_FAILED: ${err?.message || 'unknown'}` };
    }
  }

  /**
   * WhatsApp Meta Cloud API Webhook Signature verification.
   * Meta computes HMAC-SHA256 of the raw unparsed payload using the Meta App Secret.
   * Header format: "sha256=abcdef..."
   */
  public static verifyWhatsAppCloudWebhook(
    proof: ActorBindingProof,
    metaAppSecret: string
  ): { valid: boolean; error?: string } {
    const rawBody = proof.rawBody;
    const hubSignature = proof.hubSignature || proof.proofSignature;

    if (!rawBody || !hubSignature || !metaAppSecret) {
      return { valid: false, error: 'MISSING_PAYLOAD_OR_SIGNATURE_OR_SECRET' };
    }

    if (!hubSignature.startsWith('sha256=')) {
      return { valid: false, error: 'INVALID_SIGNATURE_PREFIX' };
    }

    const signatureHash = hubSignature.substring(7);
    const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;

    const calculatedHash = createHmac('sha256', metaAppSecret).update(bodyBuffer).digest('hex');

    const bufExpected = Buffer.from(calculatedHash, 'utf8');
    const bufReceived = Buffer.from(signatureHash, 'utf8');

    if (bufExpected.length !== bufReceived.length || !timingSafeEqual(bufExpected, bufReceived)) {
      return { valid: false, error: 'INVALID_META_HUB_SIGNATURE' };
    }

    return { valid: true };
  }

  /**
   * Internal Service-to-Service Secret verification.
   * Uses dedicated HERMES_INTERNAL_SERVICE_SECRET (strictly separated from HERMES_SESSION_SECRET).
   */
  public static verifyInternalServiceSecret(
    proof: ActorBindingProof,
    expectedSecret?: string
  ): { valid: boolean; error?: string } {
    const secret = expectedSecret || process.env.HERMES_INTERNAL_SERVICE_SECRET;
    if (!secret || secret.trim().length === 0) {
      return { valid: false, error: 'INTERNAL_SERVICE_SECRET_NOT_CONFIGURED' };
    }

    const serviceSecret = proof.serviceSecret || proof.proofSignature;
    if (!serviceSecret || !proof.serviceId) {
      return { valid: false, error: 'MISSING_SERVICE_CREDENTIALS' };
    }

    const bufReceived = Buffer.from(serviceSecret, 'utf8');
    const bufExpected = Buffer.from(secret, 'utf8');

    if (bufReceived.length !== bufExpected.length || !timingSafeEqual(bufReceived, bufExpected)) {
      return { valid: false, error: 'INVALID_INTERNAL_SERVICE_SECRET' };
    }

    return { valid: true };
  }
}
