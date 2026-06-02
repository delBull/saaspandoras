import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, projects } from '@/db/schema';
import { eq, desc, and, lt, or } from 'drizzle-orm';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const projectIdNum = parseInt(projectId);
        const walletAddress = req.headers.get('x-wallet-address');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Unauthorized: Missing wallet address' }, { status: 401 });
        }

        // 1. Verify Project Ownership
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectIdNum)
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check if requester is the applicant (owner)
        if (project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden: You do not own this project' }, { status: 403 });
        }

        // 2. Lazy Cleanup: Auto-expire old on_hold purchases for THIS project
        await db.update(purchases)
            .set({ 
                status: 'failed' as any,
                metadata: { expired_auto: true }
            })
            .where(
                and(
                    eq(purchases.projectId, projectIdNum),
                    eq(purchases.status, 'on_hold'),
                    lt(purchases.expiresAt, new Date())
                )
            );

        // 3. Fetch Purchases for this project
        const projectPurchases = await db.query.purchases.findMany({
            where: and(
                eq(purchases.projectId, projectIdNum),
                or(
                    eq(purchases.status, 'on_hold'),
                    eq(purchases.status, 'processing')
                )
            ),
            orderBy: [desc(purchases.createdAt)]
        });

        return NextResponse.json(projectPurchases);
    } catch (error) {
        console.error('Error fetching project purchases:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
