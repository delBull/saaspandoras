/**
 * 📡 Hermes Sovereign Direct Publishers — Type Definitions (FASE 2)
 * apps/dashboard/src/lib/hermes/channels/publishers/publisher.types.ts
 *
 * Formal contracts for Direct Channel Cloud publishing:
 * - PublicationPayload with required idempotencyKey.
 * - Uniform PublicationReceipt (success / failure / retryable).
 * - Standardized provider error taxonomy.
 */

import type { ChannelType } from '../channel-vault.service';

export type PublicationContentType = 'text' | 'image' | 'video' | 'markdown';

export interface PublicationPayload {
  text: string;
  mediaUrls?: string[];
  contentType: PublicationContentType;
  ctaUrl?: string;
  idempotencyKey: string; // Mandatory for all publishers
}

export type PublicationErrorCode =
  | 'PROVIDER_AUTH_INVALID'
  | 'PROVIDER_AUTH_EXPIRED'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_CHAT_NOT_FOUND'
  | 'PROVIDER_RATE_LIMIT'
  | 'PROVIDER_PAYLOAD_INVALID'
  | 'PROVIDER_NETWORK_ERROR'
  | 'CAPABILITY_MISMATCH'
  | 'CHANNEL_NOT_CONNECTED'
  | 'INTERNAL_ERROR';

export interface PublicationReceipt {
  success: boolean;
  channel: ChannelType;
  externalPostId?: string;
  externalUrl?: string;
  publishedAt?: string;
  idempotencyKey: string;
  errorCode?: PublicationErrorCode;
  errorMessage?: string;
  retryable?: boolean;
}

export interface PublisherContext {
  canonicalOrgId: string;
  integrationId: string;
  accountHandle: string;
  metadata?: Record<string, unknown>;
}

export interface IChannelPublisher {
  readonly channel: ChannelType;
  publish(
    credentials: Record<string, unknown>,
    payload: PublicationPayload,
    context: PublisherContext
  ): Promise<PublicationReceipt>;
}
