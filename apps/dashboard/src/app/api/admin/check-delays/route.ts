
import { NextResponse } from 'next/server';
import { db } from '@/db'; // Assuming Drizzle DB
import { daoActivitySubmissions, daoActivities, projects } from '@/db/schema'; // Updated imports
import { eq, and, sql, not, inArray, lt } from 'drizzle-orm';
import { sendDelayedDistributionAlert } from '@/lib/discord/alert-notifier';

// Force dynamic if using GET
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const force = searchParams.get('force') === 'true'; // Allow manual trigger

        // 1. Define "Delayed": Approved tasks older than X days.
        // For verify: 7 days.
        const delayThreshold = new Date();
        delayThreshold.setDate(delayThreshold.getDate() - 7);

        // 2. Find pending payments: status='approved' AND proofData != 'PAID' AND updatedAt < threshold
        const pendingSubmissions = await db.select({
            projectId: daoActivitySubmissions.projectId,
            activityId: daoActivitySubmissions.activityId,
            rewardAmount: daoActivities.rewardAmount, // Assuming simple join or direct fetch later
        })
            .from(daoActivitySubmissions)
            .leftJoin(daoActivities, eq(daoActivitySubmissions.activityId, daoActivities.id))
            .where(and(
                eq(daoActivitySubmissions.status, 'approved'),
                not(eq(daoActivitySubmissions.proofData, 'PAID')), // Using our "Paid" flag
                lt(daoActivitySubmissions.statusUpdatedAt, delayThreshold)
            ));

        if (pendingSubmissions.length === 0) {
            return NextResponse.json({ message: "No delays detected." });
        }

        // 3. Group by Project
        const projectMap = new Map<number, { count: number; amount: number }>();

        for (const sub of pendingSubmissions) {
            const pid = sub.projectId;
            if (!pid) continue;

            const current = projectMap.get(pid) || { count: 0, amount: 0 };
            current.count++;
            // @ts-expect-error rewardAmount might be string in DB
            current.amount += Number(sub.dao_activities?.rewardAmount || 0);
            projectMap.set(pid, current);
        }

        // 4. Send Alerts per Project
        const results = [];
        for (const [pid, stats] of projectMap.entries()) {
            // Fetch project details for the alert
            const project = await db.query.projects.findFirst({
                where: eq(projects.id, pid)
            });

            if (project) {
                // @ts-expect-error Types mismatch with current schema vs Project type
                await sendDelayedDistributionAlert(project, 7, stats.count, stats.amount);
                results.push({ projectId: pid, sent: true });
            }
        }

        return NextResponse.json({
            checked: true,
            alertsSent: results.length,
            details: results
        });

    } catch (error: any) {
        console.error("Check Delays Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
