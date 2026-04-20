import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoMembers, purchases } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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
        } = body;

        if (!wallet || !projectId) {
            return NextResponse.json({ error: 'Missing wallet or projectId' }, { status: 400 });
        }

        const walletLower = wallet.toLowerCase();
        const projectIdNum = Number(projectId);

        if (isNaN(projectIdNum)) {
            return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
        }

        // 1. Upsert: insert new holder or increment their artifact count
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

        return NextResponse.json({ success: true, wallet: walletLower, projectId: projectIdNum });

    } catch (error) {
        console.error('[register-holder] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
