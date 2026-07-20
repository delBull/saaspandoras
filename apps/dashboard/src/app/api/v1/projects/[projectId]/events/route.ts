import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projects, eventRegistrations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { EventRepository } from '@/lib/domain/event-repository';

type RouteParams = { params: Promise<{ projectId: string }> };

// GET /api/v1/projects/[projectId]/events — list events for a project
export async function GET(request: Request, { params }: RouteParams) {
    const { projectId: str } = await params;
    const projectId = Number(str);

    const events = await EventRepository.getEventsByProject(projectId);
        
    const regs = await db.select()
        .from(eventRegistrations)
        .where(eq(eventRegistrations.projectId, projectId));

    const eventsWithRegs = events.map(e => ({
        ...e,
        registrations: regs.filter(r => r.eventId === e.id)
    }));

    return NextResponse.json(eventsWithRegs);
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

    // [TEMPORARY BYPASS PARA TESTING]
    /*
    if (project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json({ error: 'No tienes permisos para este proyecto' }, { status: 403 });
    }
    */

    const parsedDate = date ? new Date(date) : null;
    const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

    const newEvent = await EventRepository.createEvent({
        projectId,
        title,
        type: type === 'CALENDAR' ? 'CALENDAR' : 'MACRO',
        date: isValidDate ? parsedDate : null,
        location: location || undefined,
        config: config || { maxCapacity: 20 },
        isActive: true,
    });

    return NextResponse.json(newEvent, { status: 201 });
}
