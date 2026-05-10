import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, projects, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const projectIdNum = parseInt(projectId);
        const { purchaseId, action, reason } = await req.json();
        const walletAddress = req.headers.get('x-wallet-address');

        if (!walletAddress || !purchaseId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

        if (action === 'approve') {
            // Generate integrity proof (Agreement Hash)
            const agreementContent = `Agreement for Project ${project.title} - Purchase ${purchaseId} - User ${purchase.userId} - Units ${purchase.amount}`;
            const agreementHash = crypto.createHash('sha256').update(agreementContent).digest('hex');

            await db.update(purchases)
                .set({
                    status: 'completed' as any,
                    agreementHash: agreementHash,
                    updatedAt: new Date()
                })
                .where(eq(purchases.id, purchaseId));

            console.log(`✅ Project ${projectId}: Purchase ${purchaseId} approved by owner.`);

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
