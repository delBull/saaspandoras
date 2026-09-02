
import { NextResponse } from 'next/server';
import { createPublicClient, http, parseUnits, decodeEventLog, type Hash, type Address, type Chain } from 'viem';
import { base, sepolia } from 'viem/chains';
import { db } from "@/db";
import { paymentLinks, transactions } from "@/db/schema";
import { eq } from 'drizzle-orm';
import { updatePaymentStatus } from "@/actions/clients";
import { sendPaymentNotification } from "@/lib/discord/notifier";

// USDC addresses (native) per chain
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const MERCHANT_WALLET = (process.env.PANDORAS_ADMIN_WALLET || "0xc52BB6f53C91ff7134e7508B102E5A22BA415954").toLowerCase();

const ERC20_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const CHAIN_BY_ID: Record<number, { chain: Chain; usdc: Address }> = {
  8453: { chain: base, usdc: USDC_BASE },
  11155111: { chain: sepolia, usdc: USDC_SEPOLIA },
};

function isHash(v: unknown): v is Hash {
  return typeof v === "string" && /^0x[a-fA-F0-9]{64}$/.test(v);
}

/**
 * Server-side on-chain verification of a USDC payment.
 * Rejects txHash "unknown" (client-side callback without a real hash).
 * Verifies: receipt success + an ERC20 Transfer to the link destination
 * wallet for at least the expected amount (6-decimals USDC).
 */
async function verifyCryptoPayment(txHash: Hash, chainId: number, link: { destinationWallet: string | null, amount: string }): Promise<{ ok: boolean; reason?: string }> {
  const chainCfg = CHAIN_BY_ID[chainId];
  if (!chainCfg) return { ok: false, reason: `Unsupported chainId: ${chainId}` };

  const publicClient = createPublicClient({ chain: chainCfg.chain, transport: http() });

  const receipt = await publicClient.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt) return { ok: false, reason: "Transaction not found on-chain" };
  if (receipt.status !== "success") return { ok: false, reason: "Transaction reverted on-chain" };

  const destination = (link.destinationWallet || MERCHANT_WALLET).toLowerCase();
  const expectedWei = parseUnits(link.amount, 6);

  let matched = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== chainCfg.usdc.toLowerCase()) continue;
    if (log.topics[0] !== ERC20_TRANSFER_TOPIC) continue;
    if (log.topics.length < 3) continue;

    const to = `0x${log.topics[2]?.slice(26)}`.toLowerCase();
    if (to !== destination) continue;

    try {
      const decoded = decodeEventLog({
        abi: [
          {
            anonymous: false,
            inputs: [
              { indexed: true, internalType: "address", name: "from", type: "address" },
              { indexed: true, internalType: "address", name: "to", type: "address" },
              { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
            ],
            name: "Transfer",
            type: "event",
          },
        ],
        data: log.data,
        topics: log.topics,
      });
      const value = (decoded.args as { value: bigint }).value;
      if (value >= expectedWei) {
        matched = true;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!matched) return { ok: false, reason: `No USDC transfer of >= ${link.amount} to ${destination} found in tx` };

  return { ok: true };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { linkId, chainId, txHash } = body as { linkId?: string; chainId?: number; txHash?: unknown };

        if (!linkId || !chainId || !isHash(txHash)) {
            return NextResponse.json({ success: false, error: "Missing or invalid linkId/chainId/txHash" }, { status: 400 });
        }

        // Load the payment link (idempotency + destination)
        const link = await db.query.paymentLinks.findFirst({
            where: eq(paymentLinks.id, linkId),
        });
        if (!link) {
            return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
        }

        // Idempotency guard: a completed crypto transaction for this link is final.
        const existing = await db.query.transactions.findFirst({
            where: (t, { and, eq: e }) => and(e(t.linkId, linkId), e(t.method, 'crypto'), e(t.status, 'completed')),
        });
        if (existing) {
            return NextResponse.json({ success: true, message: "Already processed", idempotent: true });
        }

        // Server-side on-chain verification (never trust the client callback alone)
        const verification = await verifyCryptoPayment(txHash, chainId, link);
        if (!verification.ok) {
            console.warn("[CRYPTO_PAYMENT] Verification failed:", verification.reason);
            return NextResponse.json({ success: false, error: verification.reason }, { status: 422 });
        }

        console.log("💰 [CRYPTO_PAYMENT] On-chain verified:", { linkId, txHash });

        const res = await updatePaymentStatus(linkId, 'paid', 'crypto');
        if (!res.success) throw new Error(res.error);

        // Notify
        await sendPaymentNotification({
            type: "payment_received",
            amount: Number(link.amount),
            currency: "USDC",
            method: "crypto",
            status: "completed",
            linkId: link.id,
            clientId: link.clientId,
            metadata: {
                txHash: String(txHash),
                chainId
            }
        });

        return NextResponse.json({ success: true, message: "Logged", txHash });
    } catch (error) {
        console.error("Crypto Verify Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
