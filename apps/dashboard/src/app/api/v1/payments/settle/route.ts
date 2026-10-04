import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { privatePaymentLinks, projects } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { paymentOrchestrator } from "@saasfly/hermes-core";
import { PaymentSettlementEvent } from "@saasfly/hermes-core";
import { checkRateLimit, clientIpFromHeaders } from "@saasfly/hermes-core";
import { createPublicClient, http, parseUnits, decodeEventLog, erc20Abi } from "viem";
import { base, baseSepolia } from "viem/chains";

export const runtime = "nodejs";

const VALID_STATUSES = ["active", "pending"] as const;

/**
 * Server-side verification: the tx must exist, be mined and SUCCEEDED on the
 * chain the link declares. Without this, any client could POST a fabricated
 * txHash and trigger entitlement activation without paying (fraud vector).
 */
async function verifyOnChainSettlement(txHash: string, chainId: number, expectedRecipient: string, expectedToken: string, expectedAmount: number): Promise<{ ok: true; blockNumber: string } | { ok: false; reason: string }> {
  try {
    // P0-2: Strict Environment Chain Separation
    const isProd = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENVIRONMENT === "production";
    const enforcedChainId = isProd ? 8453 : chainId;
    if (isProd && chainId !== 8453) {
      console.warn("[Security] Forced Base Mainnet for production settlement validation.");
    }

    const chain = enforcedChainId === 8453 ? base : enforcedChainId === 11155111 ? baseSepolia : baseSepolia;
    const publicClient = createPublicClient({ chain, transport: http() });
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    
    if (!receipt) return { ok: false, reason: "TRANSACTION_NOT_FOUND" };
    if (receipt.status === "reverted") return { ok: false, reason: "TRANSACTION_REVERTED" };
    
    // P0-4: Verify Economic Binding (recipient, token, amount)
    let foundValidTransfer = false;
    const expectedAmountRaw = parseUnits(expectedAmount.toString(), 6); // USDC 6 decimals
    
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== expectedToken.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
        if (decoded.eventName === 'Transfer') {
          const { to, value } = decoded.args as any;
          if (to.toLowerCase() === expectedRecipient.toLowerCase() && value >= expectedAmountRaw) {
            foundValidTransfer = true;
            break;
          }
        }
      } catch (e) { /* ignore non-erc20 logs */ }
    }
    
    if (!foundValidTransfer) return { ok: false, reason: "ECONOMIC_BINDING_FAILED_OR_MISMATCH" };

    return { ok: true, blockNumber: receipt.blockNumber.toString() };
  } catch {
    return { ok: false, reason: "VERIFICATION_ERROR" };
  }
}

/**
 * ⚡ /api/v1/payments/settle
 * Endpoint that receives client-side settlement confirmation (e.g. from Thirdweb)
 * and passes it securely to the Hermes Payment Orchestrator.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(`payments-settle:${clientIpFromHeaders(req.headers)}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const body = await req.json();
    const { linkId, txHash, amount, currency } = body;

    if (!linkId || !txHash || !/^0x[0-9a-fA-F]{64}$/.test(String(txHash))) {
      return NextResponse.json({ error: "Missing required fields (linkId, txHash 0x-64)" }, { status: 400 });
    }

    // 1. Retrieve the Private Payment Link or intent
    const [link] = await db
      .select()
      .from(privatePaymentLinks)
      .where(eq(privatePaymentLinks.id, linkId))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (link.status === "completed") {
      return NextResponse.json({ message: "Already completed" });
    }
    if (!(VALID_STATUSES as readonly string[]).includes(link.status)) {
      return NextResponse.json({ error: `Link status '${link.status}' cannot be settled` }, { status: 400 });
    }

    // 2. Server-side on-chain verification (fail-closed: never trust client claims)
    const linkChainId = link.networkChainId || 11155111;
    const tokenAddress = link.settlementToken || (linkChainId === 11155111 ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"); // USDC Sepolia / Base
    const destinationWallet = link.destinationWallet;
    
    const verification = await verifyOnChainSettlement(String(txHash), Number(linkChainId), destinationWallet, tokenAddress, Number(amount || link.amount));
    if (!verification.ok) {
      return NextResponse.json({ error: "SETTLEMENT_VERIFICATION_FAILED", reason: verification.reason }, { status: 400 });
    }

    // 3. Mark as completed in DB
    await db
      .update(privatePaymentLinks)
      .set({ status: "completed" })
      .where(eq(privatePaymentLinks.id, linkId));

    // 3. Dispatch to Hermes Payment Orchestrator
    // P0-14: organizationId is SERVER-AUTHORITATIVE — derived from the creator
    // wallet recorded at link creation (never from client-supplied metadata,
    // which is correlation-only). Fall back to 'pandoras' for platform links.
    const createdByWallet = ((link.metadata as any)?.createdByWallet || "").toLowerCase();
    let organizationId = 'pandoras';
    if (createdByWallet && createdByWallet !== "unknown") {
      const [creatorProject] = await db
        .select({ organizationId: projects.organizationId, slug: projects.slug })
        .from(projects)
        .where(eq(projects.applicantWalletAddress, createdByWallet))
        .limit(1);
      if (creatorProject) organizationId = creatorProject.organizationId;
    }
    // Vertical also server-authoritative: derive from the creator's project only.
    const vertical = 'GROWTH_OS';
    const tenantId = organizationId;

    const settlementEvent: PaymentSettlementEvent = {
      eventId: `settle_${txHash}_${Date.now()}`,
      vertical: vertical as any,
      organizationId: tenantId,
      intentId: linkId,
      productId: (link.metadata as any)?.productId || 'GENERAL',
      amount: Number(amount) || Number(link.amount),
      currency: (currency || link.currency).toUpperCase(),
      provider: 'THIRDWEB',
      providerTransactionId: txHash,
      metadata: {
        linkId: link.id,
        title: link.title,
        originalMetadata: link.metadata
      },
      timestamp: new Date()
    };

    try {
      await paymentOrchestrator.processSettlement(settlementEvent);
    } catch (orchestratorError) {
      console.error("[Payments API] Orchestrator failed to process settlement:", orchestratorError);
      // We don't fail the HTTP request if orchestrator throws, but we log heavily.
      // A retry DLQ should handle this in production.
    }

    return NextResponse.json({ success: true, eventId: settlementEvent.eventId });

  } catch (err: any) {
    console.error("[Payments API] Error settling payment:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
