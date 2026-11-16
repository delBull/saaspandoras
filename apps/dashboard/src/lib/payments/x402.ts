/**
 * x402 Protocol Implementation for Pandoras Growth OS & Hermes Core.
 *
 * Implements the open HTTP 402 "Payment Required" specification standardized
 * by the x402 Foundation (Coinbase + Cloudflare) for autonomous AI agents.
 *
 * Rules:
 *   - Fail-closed: invalid or missing signatures result in HTTP 402 challenges.
 *   - Treasury resolved server-side via resolveTreasuryWallet() (FC-008 / FC-013).
 *   - On-chain settlement verified on Base (8453) or Base Sepolia (84532) via viem.
 *   - Respects existing API keys (backwards-compatible for human/partner integrations).
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveTreasuryWallet, isValidDestinationWallet } from "./treasury";
import { verifyOnChainUsdcTransfer, isTxHash, type Hash } from "./onchain-verify";

export interface X402PaymentConfig {
  /** Cost in USD (e.g. 0.01 = $0.01 USDC). */
  priceUsd: number;
  /** Human & agent readable description of the protected resource. */
  description: string;
  /** EVM Chain ID. Defaults to Base (8453) in prod, Base Sepolia (84532) in staging/dev. */
  chainId?: number;
  /** Optional custom recipient wallet. Defaults to resolveTreasuryWallet(). */
  treasuryWallet?: string;
  /** Facilitator endpoint for off-chain signature settlement verification. */
  facilitatorUrl?: string;
}

export interface X402ChallengeTerms {
  x402Version: "2.0";
  scheme: "exact";
  price: string;
  amountUsd: number;
  currency: "USDC";
  network: string; // e.g. "eip155:8453" or "eip155:84532"
  chainId: number;
  payTo: string;
  facilitator: string;
  description: string;
  instructions: string;
}

export interface X402PaymentProof {
  txHash: Hash;
  chainId?: number;
}

const DEFAULT_FACILITATOR = "https://x402.org/facilitator";

/**
 * Resolves the active chainId based on environment or override.
 */
export function resolveX402ChainId(override?: number): number {
  if (override) return override;
  const isProduction = process.env.NODE_ENV === "production";
  return isProduction ? 8453 : 84532;
}

/**
 * Builds the machine-readable HTTP 402 Challenge response for AI agents.
 */
export function buildX402Challenge(config: X402PaymentConfig): NextResponse {
  const chainId = resolveX402ChainId(config.chainId);
  const treasuryRes = resolveTreasuryWallet();
  const payTo = config.treasuryWallet ?? (treasuryRes.ok ? treasuryRes.wallet : "");

  if (!isValidDestinationWallet(payTo)) {
    return NextResponse.json(
      {
        error: "CONFIGURATION_ERROR",
        message: "Treasury wallet not configured for x402 payments.",
      },
      { status: 500 }
    );
  }

  const terms: X402ChallengeTerms = {
    x402Version: "2.0",
    scheme: "exact",
    price: `$${config.priceUsd.toFixed(config.priceUsd < 0.01 ? 4 : 2)}`,
    amountUsd: config.priceUsd,
    currency: "USDC",
    network: `eip155:${chainId}`,
    chainId,
    payTo,
    facilitator: config.facilitatorUrl ?? DEFAULT_FACILITATOR,
    description: config.description,
    instructions: `Send ${config.priceUsd} USDC on chain ${chainId} to ${payTo}, then retry with header 'PAYMENT-SIGNATURE: <txHash>' or 'x-payment: <txHash>'`,
  };

  const encodedTerms = Buffer.from(JSON.stringify(terms)).toString("base64");

  return NextResponse.json(
    {
      error: "PAYMENT_REQUIRED",
      statusCode: 402,
      x402: terms,
    },
    {
      status: 402,
      headers: {
        "PAYMENT-REQUIRED": encodedTerms,
        "x402-version": "2.0",
        "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
      },
    }
  );
}

/**
 * Extracts x402 payment proof from request headers.
 * Supports standard 'PAYMENT-SIGNATURE', 'payment-signature', 'x-payment', and 'Authorization: x402 <proof>'.
 */
export function extractX402Payment(req: Request | NextRequest): X402PaymentProof | null {
  const rawHeader =
    req.headers.get("PAYMENT-SIGNATURE") ||
    req.headers.get("payment-signature") ||
    req.headers.get("x-payment") ||
    req.headers.get("X-Payment") ||
    "";

  let token = rawHeader.trim();

  if (!token) {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.toLowerCase().startsWith("x402 ")) {
      token = authHeader.slice(5).trim();
    }
  }

  if (!token) return null;

  // Case 1: Direct txHash (0x + 64 hex chars)
  if (isTxHash(token)) {
    return { txHash: token };
  }

  // Case 2: Base64 or JSON encoded payload
  try {
    let jsonStr = token;
    if (!token.startsWith("{")) {
      jsonStr = Buffer.from(token, "base64").toString("utf-8");
    }
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const hashCandidate = parsed.txHash || parsed.hash || parsed.transactionHash;
    if (isTxHash(hashCandidate)) {
      const chainId = typeof parsed.chainId === "number" ? parsed.chainId : undefined;
      return { txHash: hashCandidate, chainId };
    }
  } catch {
    // Malformed token
  }

  return null;
}

export type X402VerificationResult =
  | { ok: true; txHash: Hash; amountUsd: number; blockNumber: string }
  | { ok: false; reason: string; challenge: NextResponse };

/**
 * In-memory replay cache for used transaction hashes.
 * Ensures the same transaction hash cannot be reused across requests.
 */
const usedTxHashes = new Set<string>();

/**
 * Verifies an incoming x402 payment against on-chain USDC transfer.
 */
export async function verifyX402Payment(
  req: Request | NextRequest,
  config: X402PaymentConfig
): Promise<X402VerificationResult> {
  const proof = extractX402Payment(req);
  if (!proof) {
    return {
      ok: false,
      reason: "MISSING_PAYMENT_PROOF",
      challenge: buildX402Challenge(config),
    };
  }

  const txHashLower = proof.txHash.toLowerCase();
  if (usedTxHashes.has(txHashLower)) {
    return {
      ok: false,
      reason: "PAYMENT_ALREADY_SETTLED_REPLAY_DETECTED",
      challenge: buildX402Challenge(config),
    };
  }

  const chainId = proof.chainId ?? resolveX402ChainId(config.chainId);
  const treasuryRes = resolveTreasuryWallet();
  const payTo = config.treasuryWallet ?? (treasuryRes.ok ? treasuryRes.wallet : "");

  const onChainResult = await verifyOnChainUsdcTransfer({
    txHash: proof.txHash,
    chainId,
    treasury: payTo,
    maxBlockAge: 300, // Anti-replay: must be within the last ~10 minutes
    context: `x402:${config.description}`,
  });

  if (!onChainResult.ok) {
    return {
      ok: false,
      reason: `ONCHAIN_VERIFICATION_FAILED: ${onChainResult.reason}`,
      challenge: buildX402Challenge(config),
    };
  }

  if (onChainResult.amountUsd < config.priceUsd) {
    return {
      ok: false,
      reason: `INSUFFICIENT_PAYMENT: required $${config.priceUsd}, received $${onChainResult.amountUsd}`,
      challenge: buildX402Challenge(config),
    };
  }

  // Record hash to prevent replay attacks
  usedTxHashes.add(txHashLower);
  // Keep memory bound to 10,000 entries
  if (usedTxHashes.size > 10000) {
    const firstItem = usedTxHashes.values().next().value;
    if (firstItem) usedTxHashes.delete(firstItem);
  }

  return {
    ok: true,
    txHash: proof.txHash,
    amountUsd: onChainResult.amountUsd,
    blockNumber: onChainResult.blockNumber,
  };
}

/**
 * Creates a response with the x402 receipt header attached.
 */
export function attachX402Receipt(
  res: NextResponse,
  receipt: { txHash: Hash; amountUsd: number }
): NextResponse {
  const receiptPayload = {
    x402Version: "2.0",
    settled: true,
    txHash: receipt.txHash,
    amountUsd: receipt.amountUsd,
    settledAt: new Date().toISOString(),
  };

  const encodedReceipt = Buffer.from(JSON.stringify(receiptPayload)).toString("base64");
  res.headers.set("PAYMENT-RESPONSE", encodedReceipt);
  return res;
}
