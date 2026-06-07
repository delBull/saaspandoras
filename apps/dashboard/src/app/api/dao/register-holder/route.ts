import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { daoMembers, purchases, ambassadors, ambassadorClients, ambassadorCommissions, projects } from '@/db/schema';
import { sendPurchaseEmail } from '@/lib/email/purchase-mailer';

import { defineChain } from "thirdweb/chains";
import { client as twClient } from "@/lib/thirdweb-client";
import { eth_getTransactionReceipt, getRpcClient } from "thirdweb/rpc";

// Public endpoint called after a confirmed on-chain artifact purchase.
// The txHash + receipt.from === wallet provides the security guarantee.
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            wallet,
            projectId,
            artifactsAcquired = 1,
            phaseName,
            phaseIndex,
            txHash,
            contractAddress,
            buyerEmail,
            newsletterConsent,
            referralCode
        } = body;

        if (!wallet || !projectId) {
            return NextResponse.json({ error: 'Missing wallet or projectId' }, { status: 400 });
        }

        const walletLower = wallet.toLowerCase();
        const projectIdNum = Number(projectId);

        if (isNaN(projectIdNum)) {
            return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
        }

        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectIdNum)
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 🛡️ Verify txHash ON-CHAIN before registering
        if (!txHash || !txHash.startsWith('0x')) {
            console.warn(`[register-holder] Rejected DAO registration for ${walletLower}: Missing txHash`);
            return NextResponse.json({ error: 'Missing or invalid txHash for verification' }, { status: 403 });
        }

        try {
            const chain = defineChain(Number(project.chainId));
            const provider = getRpcClient({ client: twClient, chain });
            const receipt = await eth_getTransactionReceipt(provider, { hash: txHash as `0x${string}` });

            if (!receipt || receipt.status !== "success") {
                console.warn(`[register-holder] Rejected DAO registration for ${walletLower}: TX failed or not found`);
                return NextResponse.json({ error: 'Transaction failed or not found on blockchain' }, { status: 403 });
            }

            if (receipt.from.toLowerCase() !== walletLower) {
                console.warn(`[register-holder] Rejected DAO registration for ${walletLower}: tx.from mismatch (${receipt.from})`);
                return NextResponse.json({ error: 'Transaction sender does not match claiming wallet' }, { status: 403 });
            }
        } catch (rpcError) {
            console.error(`[register-holder] RPC Verification failed for ${txHash}:`, rpcError);
            return NextResponse.json({ error: 'Failed to verify transaction signature via RPC' }, { status: 502 });
        }

        // Look up ambassador if referral code provided (before transaction, read-only)
        let ambassador = null;
        if (referralCode) {
            ambassador = await db.query.ambassadors.findFirst({
                where: eq(ambassadors.referralCode, referralCode)
            });
        }

        // Check if returning buyer (before transaction, read-only)
        const existingHolder = await db.query.daoMembers.findFirst({
            where: and(eq(daoMembers.projectId, projectIdNum), eq(daoMembers.wallet, walletLower))
        });
        const isReturning = !!existingHolder;

        // 🛡️ All DB writes in a single atomic transaction
        const purchaseMetadata = {
            wallet: walletLower,
            artifactsAcquired,
            ...(phaseName !== undefined && { phaseName }),
            ...(phaseIndex !== undefined && { phaseIndex }),
            ...(contractAddress !== undefined && { contractAddress }),
            recordedAt: new Date().toISOString(),
        };

        await db.transaction(async (tx) => {
            // 1. Upsert DAO member
            await tx.insert(daoMembers)
                .values({
                    projectId: projectIdNum,
                    wallet: walletLower,
                    artifactsCount: artifactsAcquired,
                    votingPower: artifactsAcquired.toString(),
                    joinedAt: new Date(),
                    lastActiveAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [daoMembers.projectId, daoMembers.wallet],
                    set: {
                        artifactsCount: sql`${daoMembers.artifactsCount} + ${artifactsAcquired}`,
                        votingPower: sql`(${daoMembers.votingPower}::numeric + ${artifactsAcquired})::text`,
                        lastActiveAt: new Date(),
                    }
                });

            // 2. Record purchase (idempotent via PK = txHash)
            if (txHash) {
                await tx.insert(purchases).values({
                    id: txHash,
                    userId: walletLower,
                    projectId: projectIdNum,
                    amount: String(artifactsAcquired),
                    currency: 'CRYPTO',
                    paymentMethod: 'crypto',
                    status: 'completed',
                    purchaseId: txHash,
                    idempotencyKey: txHash,
                    thirdwebSessionId: txHash,
                    metadata: purchaseMetadata,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                }).onConflictDoNothing();
            }

            // 3. Ambassador commissions (inside same transaction)
            if (ambassador && txHash) {
                const tokenPriceUsd = project.tokenPriceUsd ? parseFloat(project.tokenPriceUsd as string) : 100;
                const totalAmountUsdc = artifactsAcquired * tokenPriceUsd;
                const commissionAmount = totalAmountUsdc * 0.04;

                // Link client to ambassador
                await tx.insert(ambassadorClients).values({
                    ambassadorId: ambassador.id,
                    clientWallet: walletLower
                }).onConflictDoNothing({ target: ambassadorClients.clientWallet });

                // 🛡️ UNIQUE(sourceTxHash) at DB level prevents duplicate commissions
                await tx.insert(ambassadorCommissions).values({
                    ambassadorId: ambassador.id,
                    clientWallet: walletLower,
                    amountUsdc: commissionAmount.toString(),
                    type: 'DIRECT_SALE_4',
                    status: 'pending',
                    sourceTxHash: txHash,
                    sourceReference: `purchase_${projectIdNum}_${artifactsAcquired}`
                }).onConflictDoNothing({ target: ambassadorCommissions.sourceTxHash });

                console.log(`[register-holder] Commission $${commissionAmount} logged for ${ambassador.referralCode}`);
            }
        });

        // 4. Send transactional email (outside transaction, best-effort)
        if (buyerEmail && newsletterConsent) {
            try {
                const originUrl = req.headers.get('origin') || 'https://dash.pandoras.finance';
                const portalUrl = `${originUrl}/portal?membership=active`;

                await sendPurchaseEmail(buyerEmail, {
                    projectName: project.title,
                    projectSlug: project.slug || 'snarai',
                    amount: artifactsAcquired,
                    isReturning,
                    legalConfig: project.legalConfig || {},
                    portalUrl
                });
                console.log(`[register-holder] Email sent successfully to ${buyerEmail}`);
            } catch (emailErr) {
                console.error('[register-holder] Failed to send transactional email:', emailErr);
            }
        }

        return NextResponse.json({ success: true, wallet: walletLower, projectId: projectIdNum });

    } catch (error) {
        console.error('[register-holder] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
