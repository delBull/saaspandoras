import { BaseVerticalPaymentAdapter } from '../adapters/base-adapter';
import { PaymentSettlementEvent, PaymentVertical } from './types';

/**
 * ⚡ Hermes Payment Orchestrator
 * Central layer that receives generic, validated settlement payloads (from Webhooks/Providers)
 * and dispatches them to the strictly isolated Vertical Domain Adapters.
 */
export class HermesPaymentOrchestrator {
  private adapters: Map<PaymentVertical, BaseVerticalPaymentAdapter> = new Map();

  /**
   * Register a domain vertical adapter
   */
  registerAdapter(adapter: BaseVerticalPaymentAdapter): void {
    if (this.adapters.has(adapter.vertical)) {
      console.warn(`[HermesPaymentOrchestrator] Overwriting adapter for vertical: ${adapter.vertical}`);
    }
    this.adapters.set(adapter.vertical, adapter);
    console.log(`[HermesPaymentOrchestrator] Adapter registered for ${adapter.vertical}`);
  }

  /**
   * Process a normalized settlement event.
   * This is called AFTER the webhook signature is verified and the Intent is resolved.
   */
  async processSettlement(event: PaymentSettlementEvent): Promise<void> {
    const adapter = this.adapters.get(event.vertical);
    
    if (!adapter) {
      throw new Error(`[HermesPaymentOrchestrator] No adapter found for vertical: ${event.vertical}`);
    }

    try {
      console.log(`[HermesPaymentOrchestrator] Routing settlement event ${event.eventId} to ${event.vertical}`);
      // Handoff to domain logic
      await adapter.handleSettlement(event);
    } catch (err: any) {
      console.error(`[HermesPaymentOrchestrator] Settlement failed for ${event.eventId} (${event.vertical}):`, err);
      // Here we could update the PaymentIntent status to 'FAILED' or create a Dead-Letter Queue event.
      throw err;
    }
  }
}

// Singleton export — with vertical adapters wired (K11-PAY: otherwise every
// settlement throws 'No adapter found' AFTER the client-facing link was already
// marked completed, silently eating the payment without activating anything).
export const paymentOrchestrator = new HermesPaymentOrchestrator();

import { GrowthPaymentAdapter } from '../adapters/growth-adapter';
import { RwaPaymentAdapter } from '../adapters/rwa-adapter';

paymentOrchestrator.registerAdapter(new GrowthPaymentAdapter());
paymentOrchestrator.registerAdapter(new RwaPaymentAdapter());
