import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, projects, daoMembers } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

async function handler(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const projectIdNum = parseInt(projectId);
        
        const { session } = await getAuth(await headers());
        const walletAddress = session?.address;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Unauthorized: Missing or invalid session' }, { status: 401 });
        }

        // Verify Project Ownership
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectIdNum)
        });

        if (!project || project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all completed purchases for this project
        const completedPurchases = await db.query.purchases.findMany({
            where: and(
                eq(purchases.projectId, projectIdNum),
                eq(purchases.status, 'completed')
            )
        });

        // Group by user/wallet and sum amounts
        const userTotals = new Map<string, number>();
        for (const p of completedPurchases) {
            if (p.userId.startsWith('0x')) {
                const current = userTotals.get(p.userId) || 0;
                userTotals.set(p.userId, current + Number(p.amount));
            }
        }

        const tokenPrice = Number(project.tokenPriceUsd || 50);

        // Transactionally update daoMembers
        await db.transaction(async (tx) => {
            await tx.delete(daoMembers).where(eq(daoMembers.projectId, projectIdNum));

            for (const [wallet, totalUsd] of userTotals.entries()) {
                const units = Math.floor(totalUsd / (tokenPrice > 0 ? tokenPrice : 50));
                if (units > 0) {
                    await tx.insert(daoMembers).values({
                        projectId: projectIdNum,
                        wallet: wallet.toLowerCase(),
                        artifactsCount: units,
                        votingPower: String(units),
                        joinedAt: new Date(),
                        lastActiveAt: new Date()
                    });
                }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `Sincronizados ${userTotals.size} miembros exitosamente.`,
            membersCount: userTotals.size
        });
    } catch (error) {
        console.error('Error syncing DAO members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const POST = withSecurity(handler as any, { rateLimit: apiRateLimiter });
