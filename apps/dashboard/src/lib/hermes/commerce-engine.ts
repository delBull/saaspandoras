import { SalesState, CustomerMemory } from './types';

export interface CommerceCheckoutSession {
  sessionId: string;
  leadId: string;
  projectSlug: string;
  tokenPriceUsd: number;
  amountTokens: number;
  totalUsd: number;
  paymentMethod: 'WEB3_USDC' | 'SPEI_FASTLANE';
  checkoutUrl: string;
  expiresAt: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
}

/**
 * Hermes Commerce Engine (Phase 3)
 * Generates dynamic Web3 & SPEI Fast Lane checkout sessions and contracts
 */
export class HermesCommerceEngine {
  static createCheckoutSession(params: {
    leadId: string;
    projectSlug: string;
    tokenPriceUsd: number;
    amountTokens?: number;
    paymentMethod: 'WEB3_USDC' | 'SPEI_FASTLANE';
  }): CommerceCheckoutSession {
    const { leadId, projectSlug, tokenPriceUsd, amountTokens = 1, paymentMethod } = params;
    const sessionId = `CHK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const totalUsd = tokenPriceUsd * amountTokens;
    const action = paymentMethod === 'WEB3_USDC' ? 'checkout' : 'fastlane';

    const baseUrl = projectSlug === 'snarai' 
      ? 'https://snarai.pandoras.finance/portal' 
      : 'https://pandoras.finance/pay';

    const checkoutUrl = `${baseUrl}?action=${action}&session=${sessionId}&tokens=${amountTokens}&amount=${totalUsd}`;

    return {
      sessionId,
      leadId,
      projectSlug,
      tokenPriceUsd,
      amountTokens,
      totalUsd,
      paymentMethod,
      checkoutUrl,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h expiration
      status: 'PENDING'
    };
  }
}
