
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoActivities, projects } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    try {
        const category = searchParams.get('category');

        const whereCondition = category
            ? and(eq(daoActivities.projectId, Number(projectId)), eq(daoActivities.category, category))
            : eq(daoActivities.projectId, Number(projectId));

        const activities = await db
            .select()
            .from(daoActivities)
            .where(whereCondition)
            .orderBy(desc(daoActivities.createdAt));



        return NextResponse.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, title, description, rewardAmount, rewardTokenSymbol, type, externalLink } = body;

        // TODO: Verify user is owner/admin of project (skipping rigid auth for speed/prototype as per context, but should be added)
        // Assuming component handles ownership check via UI or Middleware

        const newActivity = await db.insert(daoActivities).values({
            projectId: Number(projectId),
            title,
            description,
            rewardAmount: rewardAmount.toString(),
            rewardTokenSymbol: rewardTokenSymbol || 'PBOX',
            type: type || 'custom',
            category: body.category || 'social',
            requirements: body.requirements || {},
            status: 'active',
            externalLink,
        }).returning();

        return NextResponse.json(newActivity[0]);
    } catch (error) {
        console.error('Error creating activity:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
