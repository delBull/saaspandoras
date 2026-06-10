import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projectEvents, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';

type RouteParams = { params: Promise<{ projectId: string, eventId: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
    const { projectId: str, eventId: evStr } = await params;
    const projectId = Number(str);
    const eventId = Number(evStr);

    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;
    if (!walletAddress) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, date, location, config, type } = body;

    const [project] = await db.select({ id: projects.id, applicantWalletAddress: projects.applicantWalletAddress })
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const parsedDate = date ? new Date(date) : null;
    const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

    const updateData: any = {};
    if (title) updateData.title = title;
    if (type) updateData.type = type;
    if (date !== undefined) updateData.date = isValidDate ? parsedDate : null;
    if (location !== undefined) updateData.location = location || null;
    if (config) updateData.config = config;

    const [updatedEvent] = await db.update(projectEvents)
        .set(updateData)
        .where(and(eq(projectEvents.id, eventId), eq(projectEvents.projectId, projectId)))
        .returning();

    return NextResponse.json(updatedEvent, { status: 200 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
    const { projectId: str, eventId: evStr } = await params;
    const projectId = Number(str);
    const eventId = Number(evStr);

    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;
    if (!walletAddress) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await db.delete(projectEvents)
        .where(and(eq(projectEvents.id, eventId), eq(projectEvents.projectId, projectId)));

    return NextResponse.json({ success: true }, { status: 200 });
}
