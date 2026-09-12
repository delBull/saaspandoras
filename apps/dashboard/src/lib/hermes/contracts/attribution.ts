/**
 * Hermes Revenue Closer — Deterministic Attribution Contracts
 * src/lib/hermes/contracts/attribution.ts
 *
 * Provides deterministic attribution models across multi-channel customer journeys.
 * Configurable attribution windows (e.g. 180 days) without hardcoding domain rules.
 */

export type AttributionStrategy = 'FIRST_TOUCH' | 'LAST_TOUCH' | 'EXPLICIT_REFERRAL';

export type ConflictResolutionPolicy = 'FIRST_CLAIM' | 'LATEST_VALID' | 'MANUAL_REVIEW';

export type AttributionChannel = 'whatsapp' | 'telegram' | 'web_landing' | 'qr' | 'email' | 'direct';

export interface AttributionPolicy {
  strategy: AttributionStrategy;
  windowDays: number; // Configurable window (e.g., 180 days for S'Narai)
  conflictResolution: ConflictResolutionPolicy;
  allowBrokerOverride: boolean;
}

export interface AttributionRecord {
  id: string;
  leadId: string;
  referrerId?: string; // Broker / Ambassador UUID
  referralCode?: string; // e.g. "ref_CARLOS_12"
  campaignSource?: string;
  medium: AttributionChannel;
  touchTimestamp: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}

export interface AttributionContext {
  activeRecord?: AttributionRecord;
  history: AttributionRecord[];
  isDeterministic: boolean;
  status: 'RESOLVED' | 'UNATTRIBUTED' | 'DISPUTED' | 'EXPIRED';
  policyApplied: AttributionStrategy;
}
