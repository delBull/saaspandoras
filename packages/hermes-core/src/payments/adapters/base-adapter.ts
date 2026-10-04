import { PaymentSettlementEvent, PaymentVertical } from '../core/types';

/**
 * Base Adapter that every Domain Vertical (Growth, RWA, Academy) MUST implement.
 * Hermes uses this to hand off the settlement event without knowing domain-specific logic.
 */
export abstract class BaseVerticalPaymentAdapter {
  /**
   * The vertical this adapter handles (e.g., 'GROWTH_OS')
   */
  abstract readonly vertical: PaymentVertical;

  /**
   * Executes the domain-specific mutation (e.g., updating installed_products, unlocking assets).
   * @param event The normalized canonical settlement event.
   */
  abstract handleSettlement(event: PaymentSettlementEvent): Promise<void>;

  /**
   * Optional hook for reversing/handling refunds.
   */
  async handleReversal(event: PaymentSettlementEvent): Promise<void> {
    console.warn(`[VerticalPaymentAdapter] Reversal not explicitly implemented for ${this.vertical}.`);
  }
}
