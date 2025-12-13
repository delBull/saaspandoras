
import { NextResponse } from 'next/server';
import { db } from '@/db'; // Adjust path if needed
import { governanceEvents } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { z } from 'zod';

const createEventSchema = z.object({
    projectId: z.number(),
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().optional().transform((str) => str ? new Date(str) : null),
    type: z.enum(['on_chain_proposal', 'off_chain_signal', 'meeting', 'update']).default('on_chain_proposal'),
    status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).default('scheduled'),
    externalLink: z.string().url().optional().or(z.literal('')),
});

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const projectIds = searchParams.get('projectIds');

    if (!projectId && !projectIds) {
        return NextResponse.json({ error: 'Project ID(s) required' }, { status: 400 });
    }

    try {
        let whereCondition;

        if (projectIds) {
            const ids = projectIds.split(',').map(Number);
            whereCondition = inArray(governanceEvents.projectId, ids);
        } else if (projectId) {
            whereCondition = eq(governanceEvents.projectId, Number(projectId));
        }

        const events = await db.select()
            .from(governanceEvents)
            .where(whereCondition)
            .orderBy(desc(governanceEvents.startDate));

        return NextResponse.json(events);
    } catch (error) {
        console.error('Failed to fetch events:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const body = createEventSchema.parse(json);

        const [newEvent] = await db.insert(governanceEvents).values({
            projectId: body.projectId,
            title: body.title,
            description: body.description,
            startDate: body.startDate,
            endDate: body.endDate,
            type: body.type,
            status: body.status,
            externalLink: body.externalLink || null,
        }).returning();

        return NextResponse.json(newEvent);
    } catch (error) {
        console.error('Failed to create event:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
