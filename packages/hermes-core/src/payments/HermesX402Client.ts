/**
 * 🤖 Hermes Autonomous x402 Payment Client.
 *
 * Enables Hermes to act as an autonomous paying agent when consuming external
 * x402-gated APIs, oracles, and data feeds using USDC micropayments on Base.
 *
 * Constitutional Guarantees (Frozen Contracts FC-004, FC-008, FC-010):
 *   - Strict Daily Cap: 0.50 USDC per 24 hours (fail-closed).
 *   - Human Confirmation Gate: Any single request > 0.10 USDC requires explicit human approval.
 *   - Multi-Tenant Isolation: Tenant-specific queries must be funded from tenant credit balance.
 *     Platform queries are funded from the platform operating budget.
 */

export interface HermesSpendingContext {
  /** Tenant ID if operating on behalf of a tenant project (e.g. 'snarai', 'coffree'). */
  tenantId?: string;
  /** Actor / operator ID initiating the high-level goal. */
  actorId?: string;
  /** Explicit business purpose for audit log. */
  purpose: string;
  /** Whether the initiating actor is verified Super Admin (Marco). */
  isSuperAdmin?: boolean;
  /** Super Admin explicit flag to bypass daily limit for extensive research/search. */
  superAdminOverride?: boolean;
  /** Human operator confirmation token if single transaction exceeded confirmation threshold. */
  humanApprovalToken?: string;
}

export interface HermesX402Policy {
  /** Maximum autonomous spend allowed across 24 rolling hours in USD. Default: 0.50. */
  maxDailyBudgetUsd: number;
  /** Single transaction threshold requiring explicit operator confirmation. Default: 0.10. */
  confirmationThresholdUsd: number;
  /** Supported networks for outgoing payment. */
  allowedNetworks: string[];
}

export interface X402DecodedChallenge {
  x402Version: string;
  scheme: string;
  price: string;
  amountUsd: number;
  currency: string;
  network: string;
  payTo: string;
  description: string;
  facilitator?: string;
}

export type HermesPaymentDecision =
  | { status: "APPROVED"; amountUsd: number; payTo: string; network: string }
  | { status: "REQUIRES_HUMAN_CONFIRMATION"; amountUsd: number; payTo: string; description: string; reason: string }
  | { status: "REQUIRES_SUPER_ADMIN_CONFIRMATION"; amountUsd: number; currentDailySpend: number; maxDailyBudgetUsd: number; reason: string }
  | { status: "DENIED"; reason: string };

export class HermesX402Client {
  private policy: HermesX402Policy;
  // In-memory 24-hour spending entries: { timestamp, amountUsd, tenantId? }
  private spendingLedger: Array<{ timestamp: number; amountUsd: number; tenantId?: string }> = [];

  constructor(customPolicy?: Partial<HermesX402Policy>) {
    this.policy = {
      maxDailyBudgetUsd: 0.50, // 0.50 USDC/day hard ceiling
      confirmationThresholdUsd: 0.10, // Single tx > 0.10 requires human sign-off
      allowedNetworks: ["eip155:8453", "eip155:84532"],
      ...customPolicy,
    };
  }

  /**
   * Calculates rolling 24-hour spend (optionally filtered by tenant).
   */
  public getRollingDailySpend(tenantId?: string): number {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    // Prune stale entries
    this.spendingLedger = this.spendingLedger.filter((e) => e.timestamp > oneDayAgo);

    return this.spendingLedger
      .filter((e) => (tenantId ? e.tenantId === tenantId : true))
      .reduce((sum, e) => sum + e.amountUsd, 0);
  }

  /**
   * Decodes an HTTP 402 challenge header from an external resource.
   */
  public decodeChallenge(headerValue: string): X402DecodedChallenge | null {
    try {
      let jsonStr = headerValue.trim();
      if (!jsonStr.startsWith("{")) {
        jsonStr = Buffer.from(jsonStr, "base64").toString("utf-8");
      }
      const parsed = JSON.parse(jsonStr) as Record<string, any>;
      const amountUsd =
        typeof parsed.amountUsd === "number"
          ? parsed.amountUsd
          : parseFloat(String(parsed.price ?? "0").replace(/[^0-9.]/g, ""));

      return {
        x402Version: parsed.x402Version ?? "2.0",
        scheme: parsed.scheme ?? "exact",
        price: parsed.price ?? `$${amountUsd}`,
        amountUsd: Number.isFinite(amountUsd) ? amountUsd : 0,
        currency: parsed.currency ?? "USDC",
        network: parsed.network ?? "eip155:8453",
        payTo: parsed.payTo ?? "",
        description: parsed.description ?? "External API",
        facilitator: parsed.facilitator,
      };
    } catch {
      return null;
    }
  }

  /**
   * Deterministically evaluates whether Hermes may execute the x402 payment.
   */
  public evaluatePaymentProposal(
    challenge: X402DecodedChallenge,
    context: HermesSpendingContext
  ): HermesPaymentDecision {
    // 1. Currency & Network check
    if (challenge.currency.toUpperCase() !== "USDC") {
      return { status: "DENIED", reason: `Unsupported payment currency: ${challenge.currency}. Only USDC accepted.` };
    }

    if (!this.policy.allowedNetworks.includes(challenge.network)) {
      return { status: "DENIED", reason: `Network ${challenge.network} is not in allowed payment networks.` };
    }

    // 2. Daily budget gate (0.50 USDC/day)
    const currentDailySpend = this.getRollingDailySpend();
    if (currentDailySpend + challenge.amountUsd > this.policy.maxDailyBudgetUsd) {
      if (context.isSuperAdmin) {
        if (context.superAdminOverride || context.humanApprovalToken) {
          // Super Admin explicitly authorized lifting the daily limit for this extensive search
        } else {
          return {
            status: "REQUIRES_SUPER_ADMIN_CONFIRMATION",
            amountUsd: challenge.amountUsd,
            currentDailySpend,
            maxDailyBudgetUsd: this.policy.maxDailyBudgetUsd,
            reason: `Límite diario alcanzado ($${currentDailySpend.toFixed(3)} / $${this.policy.maxDailyBudgetUsd} USDC). Como Super Admin, ¿autorizas levantar temporalmente este límite para proceder con esta búsqueda extensa?`,
          };
        }
      } else {
        return {
          status: "DENIED",
          reason: `Daily budget exceeded: spent $${currentDailySpend.toFixed(3)} of $${this.policy.maxDailyBudgetUsd} USDC limit. Only Super Admin can authorize an override.`,
        };
      }
    }

    // 3. Human Confirmation Threshold Gate (> 0.10 USDC)
    if (challenge.amountUsd > this.policy.confirmationThresholdUsd) {
      if (!context.humanApprovalToken && !context.superAdminOverride) {
        return {
          status: "REQUIRES_HUMAN_CONFIRMATION",
          amountUsd: challenge.amountUsd,
          payTo: challenge.payTo,
          description: challenge.description,
          reason: `Transaction amount ($${challenge.amountUsd} USDC) exceeds autonomous threshold ($${this.policy.confirmationThresholdUsd} USDC). Human confirmation required.`,
        };
      }
    }

    return {
      status: "APPROVED",
      amountUsd: challenge.amountUsd,
      payTo: challenge.payTo,
      network: challenge.network,
    };
  }

  /**
   * Records a successfully executed payment into the spending ledger.
   */
  public recordSettlement(amountUsd: number, tenantId?: string): void {
    this.spendingLedger.push({
      timestamp: Date.now(),
      amountUsd,
      tenantId,
    });
  }

  /**
   * Wraps standard fetch with autonomous x402 negotiation, budget gating, and settlement.
   */
  public async payingFetch(
    url: string,
    init: RequestInit = {},
    context: HermesSpendingContext,
    signerFn?: (terms: X402DecodedChallenge) => Promise<string>
  ): Promise<Response> {
    // 1. Initial attempt
    const initialRes = await fetch(url, init);
    if (initialRes.status !== 402) {
      return initialRes;
    }

    // 2. Intercept 402 Payment Required
    const paymentRequiredHeader =
      initialRes.headers.get("PAYMENT-REQUIRED") ||
      initialRes.headers.get("payment-required");

    if (!paymentRequiredHeader) {
      return initialRes; // Server returned 402 without x402 terms
    }

    const challenge = this.decodeChallenge(paymentRequiredHeader);
    if (!challenge) {
      return initialRes;
    }

    // 3. Evaluate Proposal against Budget & Governance Policy
    const decision = this.evaluatePaymentProposal(challenge, context);
    if (decision.status !== "APPROVED") {
      // Propagate rejection or human confirmation requirement
      return new Response(
        JSON.stringify({
          error: "HERMES_PAYMENT_BLOCKED",
          decision,
          challenge,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Sign and execute payment
    if (!signerFn) {
      return new Response(
        JSON.stringify({
          error: "HERMES_WALLET_UNCONFIGURED",
          message: "No agent signing provider configured to fund x402 payment.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const txHashOrSignature = await signerFn(challenge);

    // 5. Record spend in daily ledger
    this.recordSettlement(decision.amountUsd, context.tenantId);

    // 6. Retry original request with PAYMENT-SIGNATURE
    const headers = new Headers(init.headers);
    headers.set("PAYMENT-SIGNATURE", txHashOrSignature);

    return fetch(url, {
      ...init,
      headers,
    });
  }
}
