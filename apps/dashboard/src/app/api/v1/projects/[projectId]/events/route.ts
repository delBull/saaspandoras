import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projectEvents, projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';

type RouteParams = { params: Promise<{ projectId: string }> };

// GET /api/v1/projects/[projectId]/events — list events for a project
export async function GET(request: Request, { params }: RouteParams) {
    const { projectId: str } = await params;
    const projectId = Number(str);

    const events = await db.select()
        .from(projectEvents)
        .where(eq(projectEvents.projectId, projectId))
        .orderBy(desc(projectEvents.createdAt));

    return NextResponse.json(events);
}

// POST /api/v1/projects/[projectId]/events — create a new event
export async function POST(request: Request, { params }: RouteParams) {
    const { projectId: str } = await params;
    const projectId = Number(str);

    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;
    if (!walletAddress) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, date, location, config, type } = body;

    if (!title) {
        return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    // Verify project exists and user is the owner
    const [project] = await db.select({ id: projects.id, applicantWalletAddress: projects.applicantWalletAddress })
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    if (project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json({ error: 'No tienes permisos para este proyecto' }, { status: 403 });
    }

    const [newEvent] = await db.insert(projectEvents).values({
        projectId,
        title,
        type: type === 'CALENDAR' ? 'CALENDAR' : 'MACRO',
        date: date ? new Date(date) : null,
        location: location || null,
        config: config || { maxCapacity: 20 },
        isActive: true,
    }).returning();

    return NextResponse.json(newEvent, { status: 201 });
}
