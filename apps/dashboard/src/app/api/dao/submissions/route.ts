
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoActivitySubmissions, daoActivities } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get('activityId');
    const projectId = searchParams.get('projectId');
    const userAddress = searchParams.get('userAddress');

    try {
        const conditions = [];
        if (activityId) conditions.push(eq(daoActivitySubmissions.activityId, Number(activityId)));
        if (projectId) conditions.push(eq(daoActivitySubmissions.projectId, Number(projectId)));
        if (userAddress) conditions.push(eq(daoActivitySubmissions.userWallet, userAddress));

        const submissions = await db.select({
            id: daoActivitySubmissions.id,
            projectId: daoActivitySubmissions.projectId,
            activityId: daoActivitySubmissions.activityId,
            userWallet: daoActivitySubmissions.userWallet,
            status: daoActivitySubmissions.status,
            proofData: daoActivitySubmissions.proofData,
            statusUpdatedAt: daoActivitySubmissions.statusUpdatedAt,
            createdAt: daoActivitySubmissions.createdAt,
            rewardAmount: daoActivities.rewardAmount,
            rewardTokenSymbol: daoActivities.rewardTokenSymbol,
            activityTitle: daoActivities.title
        })
        .from(daoActivitySubmissions)
        .leftJoin(daoActivities, eq(daoActivitySubmissions.activityId, daoActivities.id))
        .where(and(...conditions));

        return NextResponse.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, activityId, userWalletAddress, proof, status, action } = body;

        // action: 'start' | 'claim' | 'verify'

        if (action === 'start') {
            // Check if already started
            const existing = await db.select().from(daoActivitySubmissions)
                .where(and(
                    eq(daoActivitySubmissions.activityId, Number(activityId)),
                    eq(daoActivitySubmissions.userWallet, userWalletAddress)
                ))
                .limit(1);

            if (existing.length > 0) {
                return NextResponse.json({ error: 'Already started' }, { status: 400 });
            }

            const newSubmission = await db.insert(daoActivitySubmissions).values({
                projectId: Number(projectId),
                activityId: Number(activityId),
                userWallet: userWalletAddress,
                proofData: 'started',
                status: 'pending',
                startedAt: new Date(),
            }).returning();

            return NextResponse.json(newSubmission[0]);
        }

        if (action === 'claim') {
            // Update status
            // Verify time logic here or trust client? Trust client for MVP but backend check is better.
            // Fetch activity to check duration.
            const activity = await db.query.daoActivities.findFirst({
                where: eq(daoActivities.id, Number(activityId))
            });

            if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

            // @ts-expect-error: JSONB type inference for activity requirements
            const duration = activity.requirements?.durationSeconds || 0;

            // Fetch submission
            const existing = await db.select().from(daoActivitySubmissions)
                .where(and(
                    eq(daoActivitySubmissions.activityId, Number(activityId)),
                    eq(daoActivitySubmissions.userWallet, userWalletAddress),
                    eq(daoActivitySubmissions.status, 'pending')
                ))
                .limit(1);

            if (existing.length === 0 || !existing[0]) return NextResponse.json({ error: 'No pending submission' }, { status: 404 });

            const submission = existing[0];
            const elapsed = (Date.now() - (new Date(submission.startedAt!).getTime())) / 1000;

            if (elapsed < duration) {
                return NextResponse.json({ error: 'Not enough time elapsed' }, { status: 400 });
            }

            // Complete it
            const updated = await db.update(daoActivitySubmissions)
                .set({ status: 'approved', proofData: proof || 'completed', statusUpdatedAt: new Date() })
                .where(eq(daoActivitySubmissions.id, submission.id))
                .returning();

            return NextResponse.json(updated[0]);
        }

        if (action === 'payout') {
            // Admin only - theoretically check session here or assume protected route middleware
            const { submissionIds } = body;

            if (!Array.isArray(submissionIds)) return NextResponse.json({ error: 'Invalid submission IDs' }, { status: 400 });

            const updated = await db.update(daoActivitySubmissions)
                .set({ proofData: 'PAID', statusUpdatedAt: new Date() })
                .where(inArray(daoActivitySubmissions.id, submissionIds))
                .returning();

            return NextResponse.json(updated);
        }

        // Default create (legacy / simple)
        const newSubmission = await db.insert(daoActivitySubmissions).values({
            projectId: Number(projectId),
            activityId: Number(activityId),
            userWallet: userWalletAddress,
            proofData: proof || '',
            status: status || 'pending',
        }).returning();

        return NextResponse.json(newSubmission[0]);

    } catch (error) {
        console.error('Error processing submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
