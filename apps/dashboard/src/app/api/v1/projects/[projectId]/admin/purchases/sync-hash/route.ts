import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const projectIdNum = parseInt(projectId);
        const { purchaseId, txHash } = await req.json();

        const { session } = await getAuth(await headers());
        const walletAddress = session?.address;

        if (!walletAddress || !purchaseId || !txHash) {
            return NextResponse.json({ error: 'Unauthorized or missing fields' }, { status: 400 });
        }

        // 1. Verify Project Ownership
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectIdNum)
        });

        if (!project || project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Update Purchase with TX Hash
        await db.update(purchases)
            .set({
                transactionHash: txHash,
                updatedAt: new Date()
            })
            .where(and(
                eq(purchases.id, purchaseId),
                eq(purchases.projectId, projectIdNum)
            ));

        console.log(`🔗 Project ${projectId}: Purchase ${purchaseId} synced with TX ${txHash}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in sync-hash:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
