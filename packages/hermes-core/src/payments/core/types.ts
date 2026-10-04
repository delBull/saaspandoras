/**
 * 💸 Hermes Payment Core - Canonical Types
 * 
 * Defines the strict, provider-agnostic domain models for the Payment Orchestration layer.
 */

export type CanonicalPaymentStatus = 
  | 'CREATED'
  | 'PENDING'
  | 'REQUIRES_ACTION'
  | 'PROCESSING'
  | 'SETTLED'
  | 'RECONCILED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED';

export type PaymentVertical = 'GROWTH_OS' | 'RWA' | 'ACADEMY' | 'HERMES_OS';

export interface PaymentIntent {
  id: string;
  organizationId: string;
  identityId?: string; // Optional depending on the operation
  vertical: PaymentVertical;
  productId: string;
  intentType: string; // e.g., 'SUBSCRIPTION_UPGRADE', 'ASSET_PURCHASE'
  amount: number;
  currency: string;
  provider: 'STRIPE' | 'THIRDWEB' | 'CRYPTO_PAY';
  status: CanonicalPaymentStatus;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface PaymentSettlementEvent {
  eventId: string;
  timestamp: Date;
  intentId: string;
  organizationId: string;
  vertical: PaymentVertical;
  productId: string;
  amount: number;
  currency: string;
  provider: string;
  providerTransactionId: string; // Hash on-chain o Charge ID
  metadata?: Record<string, any>;
}
