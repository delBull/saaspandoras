import { describe, it, expect, beforeEach } from "vitest";
import { HermesX402Client, type HermesSpendingContext } from "../HermesX402Client";

describe("HermesX402Client — Autonomous Spending Safety Gates", () => {
  let client: HermesX402Client;
  const context: HermesSpendingContext = {
    tenantId: "snarai",
    actorId: "actor-1",
    purpose: "Testing external RWA oracle consultation",
  };

  beforeEach(() => {
    client = new HermesX402Client();
  });

  it("decodes x402 base64 challenge terms correctly", () => {
    const rawChallenge = {
      x402Version: "2.0",
      scheme: "exact",
      price: "$0.005",
      amountUsd: 0.005,
      currency: "USDC",
      network: "eip155:8453",
      payTo: "0xc52bb6f53c91ff7134e7508b102e5a22ba415954",
      description: "External Oracle Feed",
    };

    const encoded = Buffer.from(JSON.stringify(rawChallenge)).toString("base64");
    const decoded = client.decodeChallenge(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.amountUsd).toBe(0.005);
    expect(decoded?.currency).toBe("USDC");
    expect(decoded?.network).toBe("eip155:8453");
    expect(decoded?.payTo).toBe("0xc52bb6f53c91ff7134e7508b102e5a22ba415954");
  });

  it("approves payment when amount is under confirmation threshold ($0.10) and under daily budget ($0.50)", () => {
    const challenge = {
      x402Version: "2.0",
      scheme: "exact",
      price: "$0.01",
      amountUsd: 0.01,
      currency: "USDC",
      network: "eip155:8453",
      payTo: "0x1234567890abcdef1234567890abcdef12345678",
      description: "Small micropayment",
    };

    const decision = client.evaluatePaymentProposal(challenge, context);
    expect(decision.status).toBe("APPROVED");
  });

  it("triggers REQUIRES_HUMAN_CONFIRMATION when single tx exceeds $0.10 USDC without human approval", () => {
    const challenge = {
      x402Version: "2.0",
      scheme: "exact",
      price: "$0.15",
      amountUsd: 0.15,
      currency: "USDC",
      network: "eip155:8453",
      payTo: "0x1234567890abcdef1234567890abcdef12345678",
      description: "Heavy dataset extraction",
    };

    const decision = client.evaluatePaymentProposal(challenge, context);
    expect(decision.status).toBe("REQUIRES_HUMAN_CONFIRMATION");
    if (decision.status === "REQUIRES_HUMAN_CONFIRMATION") {
      expect(decision.amountUsd).toBe(0.15);
      expect(decision.reason).toContain("exceeds autonomous threshold");
    }
  });

  it("approves > $0.10 USDC transaction when valid human approval token is provided", () => {
    const challenge = {
      x402Version: "2.0",
      scheme: "exact",
      price: "$0.15",
      amountUsd: 0.15,
      currency: "USDC",
      network: "eip155:8453",
      payTo: "0x1234567890abcdef1234567890abcdef12345678",
      description: "Approved heavy dataset extraction",
    };

    const approvedContext: HermesSpendingContext = {
      ...context,
      humanApprovalToken: "gov-token-approved-by-super-admin",
    };

    const decision = client.evaluatePaymentProposal(challenge, approvedContext);
    expect(decision.status).toBe("APPROVED");
  });

  it("strictly DENIES payment when daily budget ($0.50 USDC) is exceeded", () => {
    // Record $0.49 of previous spend today
    client.recordSettlement(0.49, "snarai");

    const challenge = {
      x402Version: "2.0",
      scheme: "exact",
      price: "$0.02",
      amountUsd: 0.02,
      currency: "USDC",
      network: "eip155:8453",
      payTo: "0x1234567890abcdef1234567890abcdef12345678",
      description: "Next request",
    };

    const decision = client.evaluatePaymentProposal(challenge, context);
    expect(decision.status).toBe("DENIED");
    if (decision.status === "DENIED") {
      expect(decision.reason).toContain("Daily budget exceeded");
    }
  });

  it("prompts Super Admin for confirmation when budget is reached, instead of hard denial", () => {
    client.recordSettlement(0.49, "snarai");

    const challenge = {
      x402Version: "2.0",
      scheme: "exact",
      price: "$0.05",
      amountUsd: 0.05,
      currency: "USDC",
      network: "eip155:8453",
      payTo: "0x1234567890abcdef1234567890abcdef12345678",
      description: "Extensive market search",
    };

    const superAdminContext: HermesSpendingContext = {
      ...context,
      isSuperAdmin: true,
      superAdminOverride: false,
    };

    const decision = client.evaluatePaymentProposal(challenge, superAdminContext);
    expect(decision.status).toBe("REQUIRES_SUPER_ADMIN_CONFIRMATION");
    if (decision.status === "REQUIRES_SUPER_ADMIN_CONFIRMATION") {
      expect(decision.reason).toContain("Como Super Admin, ¿autorizas levantar temporalmente este límite");
    }
  });

  it("allows extensive search beyond daily budget when Super Admin authorizes override", () => {
    client.recordSettlement(0.50, "snarai");

    const challenge = {
      x402Version: "2.0",
      scheme: "exact",
      price: "$0.20",
      amountUsd: 0.20,
      currency: "USDC",
      network: "eip155:8453",
      payTo: "0x1234567890abcdef1234567890abcdef12345678",
      description: "Super Admin authorized extensive intelligence scrape",
    };

    const overrideContext: HermesSpendingContext = {
      ...context,
      isSuperAdmin: true,
      superAdminOverride: true,
    };

    const decision = client.evaluatePaymentProposal(challenge, overrideContext);
    expect(decision.status).toBe("APPROVED");
  });
});
