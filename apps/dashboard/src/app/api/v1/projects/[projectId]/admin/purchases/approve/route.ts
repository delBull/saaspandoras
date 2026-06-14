import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, projects, users, daoMembers, ambassadors, ambassadorClients, ambassadorCommissions } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { TelemetryService } from '@/lib/security/telemetry';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

async function handler(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const projectIdNum = parseInt(projectId);
        const { purchaseId, action, reason } = await req.json();
        const { session } = await getAuth(await headers());
        const walletAddress = session?.address;

        if (!walletAddress || !purchaseId || !action) {
            return NextResponse.json({ error: 'Missing required fields or Unauthorized' }, { status: 400 });
        }

        // 1. Verify Project Ownership
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectIdNum)
        });

        if (!project || project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch Purchase and verify it belongs to this project
        const purchase = await db.query.purchases.findFirst({
            where: and(
                eq(purchases.id, purchaseId),
                eq(purchases.projectId, projectIdNum)
            )
        });

        if (!purchase) {
            return NextResponse.json({ error: 'Purchase not found in this project' }, { status: 404 });
        }

        // 3. Resolve Target Wallet for Blockchain Issuance
        let targetWallet = purchase.userId.startsWith('0x') ? purchase.userId : null;
        
        if (!targetWallet) {
            // Find email of the shadow user
            const shadowUser = await db.query.users.findFirst({
                where: eq(users.id, purchase.userId)
            });
            
            if (shadowUser?.email) {
                // Find if a real wallet user exists with this email
                const realUser = await db.query.users.findFirst({
                    where: and(
                        eq(users.email, shadowUser.email),
                        sql`${users.id} LIKE '0x%'`
                    )
                });
                if (realUser) targetWallet = realUser.id;
            }
        }

        // 4. Calculate Units
        const tokenPrice = Number(project.tokenPriceUsd || 50);
        const units = Math.floor(Number(purchase.amount) / (tokenPrice > 0 ? tokenPrice : 50));

        // Fix #9: Validate units against max possible (prevent overflow/abuse)
        // Default max: 1M tokens (1,000,000) - reasonable limit for most DAOs
        const maxUnits = 1000000;
        if (units > maxUnits) {
            return NextResponse.json({ 
                error: `Units exceed maximum allowed (${maxUnits}). Contact support.` 
            }, { status: 400 });
        }

        if (action === 'approve') {
            // Generate integrity proof (Agreement Hash)
            const agreementContent = `Agreement for Project ${project.title} - Purchase ${purchaseId} - User ${purchase.userId} - Units ${purchase.amount}`;
            const agreementHash = crypto.createHash('sha256').update(agreementContent).digest('hex');

            // Ambassador Logic
            let ambassador = null;
            const meta = purchase.metadata as any;
            const referralCode = meta?.referralCode || meta?.ref;
            if (referralCode) {
                ambassador = await db.query.ambassadors.findFirst({
                    where: eq(ambassadors.referralCode, String(referralCode))
                });
            }

            // 🔒 FIX #1: WRAP BOTH UPDATES IN A SINGLE TRANSACTION to prevent race conditions
            // This ensures either BOTH the purchase update AND daoMembers sync succeed,
            // or NEITHER does - atomic operation.
            await db.transaction(async (tx) => {
                // Step 1: Update purchase status
                await tx.update(purchases)
                    .set({
                        status: 'completed' as any,
                        agreementHash: agreementHash,
                        updatedAt: new Date()
                    })
                    .where(eq(purchases.id, purchaseId));

                // Step 2: Register/Update member in DAO Statistics (isolated in transaction)
                if (targetWallet) {
                    await tx.insert(daoMembers).values({
                        projectId: projectIdNum,
                        wallet: targetWallet.toLowerCase(),
                        artifactsCount: units,
                        votingPower: String(units),
                        joinedAt: new Date()
                    }).onConflictDoUpdate({
                        target: [daoMembers.projectId, daoMembers.wallet],
                        set: { 
                            artifactsCount: sql`${daoMembers.artifactsCount} + ${units}`,
                            votingPower: sql`CAST(${daoMembers.votingPower} + CAST(${units} AS DECIMAL) AS VARCHAR)`,
                            lastActiveAt: new Date()
                        }
                    });

                    // Step 3: Compute commissions if ambassador exists
                    if (ambassador) {
                        const tokenPriceUsd = project.tokenPriceUsd ? parseFloat(project.tokenPriceUsd as string) : 50;
                        const totalAmountUsdc = units * tokenPriceUsd;
                        const commissionAmount = totalAmountUsdc * 0.04;

                        // Link client to ambassador
                        await tx.insert(ambassadorClients).values({
                            ambassadorId: ambassador.id,
                            clientWallet: targetWallet.toLowerCase()
                        }).onConflictDoNothing({ target: ambassadorClients.clientWallet });

                        // Log commission
                        await tx.insert(ambassadorCommissions).values({
                            ambassadorId: ambassador.id,
                            clientWallet: targetWallet.toLowerCase(),
                            amountUsdc: commissionAmount.toString(),
                            type: 'DIRECT_SALE_4',
                            status: 'pending',
                            sourceTxHash: purchaseId, // using purchaseId since no txHash for fiat approval
                            sourceReference: `fiat_purchase_${projectIdNum}_${units}`
                        }).onConflictDoNothing({ target: ambassadorCommissions.sourceTxHash });

                        console.log(`✅ Project ${projectId}: Commission $${commissionAmount} logged for ${ambassador.referralCode}`);
                    }
                }
            });

            console.log(`✅ Project ${projectId}: Purchase ${purchaseId} approved and synced to DAO (transactional).`);

            TelemetryService.sendAlert(
              '💰 Purchase Approved',
              `El creador del proyecto ha aprobado una compra manualmente y se han sincronizado los tokens al DAO.`,
              'INFO',
              { 
                project: project.title,
                purchaseId,
                units,
                targetWallet
              }
            );

        } else if (action === 'reject') {
            await db.update(purchases)
                .set({
                    status: 'rejected' as any,
                    metadata: {
                        ...(purchase.metadata as any),
                        rejectionReason: reason || 'Transferencia no encontrada o datos incorrectos.'
                    },
                    updatedAt: new Date()
                })
                .where(eq(purchases.id, purchaseId));

            console.log(`❌ Project ${projectId}: Purchase ${purchaseId} rejected by owner. Reason: ${reason}`);
        }

        return NextResponse.json({ 
            success: true,
            targetWallet,
            units: units || 1,
            agreementHash: action === 'approve' ? (purchase.agreementHash || null) : null
        });
    } catch (error) {
        console.error('Error in project purchase approval:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const POST = withSecurity(handler as any, { rateLimit: apiRateLimiter });
