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
  }): CommerceCheckoutSession & { speiDetails?: Record<string, string> } {
    const { leadId, projectSlug, tokenPriceUsd, amountTokens = 1, paymentMethod } = params;
    const sessionId = `CHK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const totalUsd = tokenPriceUsd * amountTokens;
    const action = paymentMethod === 'WEB3_USDC' ? 'web3' : 'spei';

    // S'Narai live checkout lives in the Pandoras Growth OS dashboard pay flow.
    // The tier segment is resolved dynamically via matchPhase in the pay page.
    const baseUrl = projectSlug === 'snarai'
      ? 'https://dash.pandoras.finance/pay/snarai/fundador'
      : 'https://dash.pandoras.finance/pay';

    const origin = encodeURIComponent('https://snarai.aztecaz.xyz');
    const checkoutUrl = `${baseUrl}?origin=${origin}&quantity=${amountTokens}&method=${action}`;

    // Dynamic Organization Billing Profile resolution (Multi-tenant SPEI Rails)
    const speiDetails = paymentMethod === 'SPEI_FASTLANE' ? {
      beneficiary: process.env.SPEI_BENEFICIARY || process.env.NEXT_PUBLIC_SPEI_BENEFICIARY || "Beneficiario Institucional",
      commercialName: process.env.SPEI_COMMERCIAL_NAME || "Pandora's Platform",
      bankName: process.env.SPEI_BANK_NAME || "Banregio",
      clabe: process.env.SPEI_BANK_CLABE || "",
      concept: `RESERVA-${sessionId}`,
    } : undefined;

    return {
      sessionId,
      leadId,
      projectSlug,
      tokenPriceUsd,
      amountTokens,
      totalUsd,
      paymentMethod,
      checkoutUrl,
      speiDetails,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h expiration
      status: 'PENDING'
    };
  }
}
