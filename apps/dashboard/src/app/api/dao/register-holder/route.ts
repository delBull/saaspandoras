import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoMembers, purchases } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendPurchaseEmail } from '@/lib/email/purchase-mailer';
import { projects } from '@/db/schema';

import { defineChain } from "thirdweb/chains";
import { client as twClient } from "@/lib/thirdweb-client";
import { eth_getTransactionReceipt, getRpcClient } from "thirdweb/rpc";

// Public endpoint called after a confirmed on-chain artifact purchase
// to register/update the buyer as a unique holder in daoMembers
// and record phase metadata in the purchases table.
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            wallet,
            projectId,
            artifactsAcquired = 1,
            // Phase tracking fields (optional, for V1 monolithic model)
            phaseName,
            phaseIndex,
            txHash,
            contractAddress,
            buyerEmail,
            newsletterConsent
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

        // 🛡️ CYBER SECURITY FIX: Verify txHash ON-CHAIN before incrementing DAO Members
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

            // Verify the sender of the transaction matches the wallet claiming the purchase
            if (receipt.from.toLowerCase() !== walletLower) {
                console.warn(`[register-holder] Rejected DAO registration for ${walletLower}: tx.from mismatch (${receipt.from})`);
                return NextResponse.json({ error: 'Transaction sender does not match claiming wallet' }, { status: 403 });
            }
        } catch (rpcError) {
            console.error(`[register-holder] RPC Verification failed for ${txHash}:`, rpcError);
            return NextResponse.json({ error: 'Failed to verify transaction signature via RPC' }, { status: 502 });
        }

        // 1. Check if returning buyer
        const existingHolder = await db.query.daoMembers.findFirst({
            where: and(eq(daoMembers.projectId, projectIdNum), eq(daoMembers.wallet, walletLower))
        });
        const isReturning = !!existingHolder;

        // 2. Upsert: insert new holder or increment their artifact count
        await db.insert(daoMembers)
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
                    // Safely increment artifact count and voting power
                    artifactsCount: sql`${daoMembers.artifactsCount} + ${artifactsAcquired}`,
                    votingPower: sql`(${daoMembers.votingPower}::numeric + ${artifactsAcquired})::text`,
                    lastActiveAt: new Date(),
                }
            });

        // 2. Record purchase with phase metadata (fire-and-forget, non-critical)
        // This is key for V1 monolithic model: tracks WHICH phase was acquired.
        if (txHash) {
            const purchaseMetadata = {
                wallet: walletLower,
                artifactsAcquired,
                ...(phaseName !== undefined && { phaseName }),
                ...(phaseIndex !== undefined && { phaseIndex }),
                ...(contractAddress !== undefined && { contractAddress }),
                recordedAt: new Date().toISOString(),
            };

            try {
                await db.insert(purchases).values({
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
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                }).onConflictDoNothing(); // Idempotent — ignore duplicate txHash
            } catch (purchaseErr) {
                // Non-critical — holder registration succeeded, purchase record is bonus
                console.warn('[register-holder] Purchase record insert skipped (likely duplicate):', (purchaseErr as Error).message);
            }
        }

        // 3. Send Transactonal Welcome / Addon Email
        if (buyerEmail && newsletterConsent) {
            try {
                const project = await db.query.projects.findFirst({
                    where: eq(projects.id, projectIdNum)
                });
                if (project) {
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
                }
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
