import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';

type RouteParams = { params: Promise<{ projectId: string }> };

// PATCH /api/v1/projects/[projectId]/admin/config
// Updates extra_config (resource hub, calendar, events config) for a project.
// Auth: project owner or admin.
export async function PATCH(request: Request, { params }: RouteParams) {
    const { projectId: projectIdStr } = await params;
    const projectId = Number(projectIdStr);

    if (isNaN(projectId)) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;
    if (!walletAddress) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate URLs if resourceHub is being updated
    if (body.resourceHub?.documents) {
        for (const doc of body.resourceHub.documents) {
            if (doc.url) {
                try {
                    new URL(doc.url);
                } catch {
                    return NextResponse.json({ error: `URL inválida en documento: ${doc.title || 'sin título'}` }, { status: 400 });
                }
            }
        }
    }
    if (body.resourceHub?.community) {
        for (const comm of body.resourceHub.community) {
            if (comm.url) {
                try {
                    new URL(comm.url);
                } catch {
                    return NextResponse.json({ error: `URL inválida en comunidad: ${comm.label || 'sin etiqueta'}` }, { status: 400 });
                }
            }
        }
    }
    if (body.sovereignCalendar?.calendarUrl) {
        try {
            new URL(body.sovereignCalendar.calendarUrl);
        } catch {
            return NextResponse.json({ error: 'URL del calendario inválida' }, { status: 400 });
        }
    }

    // Fetch current project with owner check
    const [project] = await db.select({ id: projects.id, extraConfig: projects.extraConfig, applicantWalletAddress: projects.applicantWalletAddress })
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

    // Deep merge: preserve existing keys, update only what's sent
    const currentConfig = (project.extraConfig as Record<string, any>) || {};
    const updatedConfig = { ...currentConfig };

    if ('resourceHub' in body) updatedConfig.resourceHub = body.resourceHub;
    if ('sovereignCalendar' in body) updatedConfig.sovereignCalendar = body.sovereignCalendar;
    if ('eventEngine' in body) updatedConfig.eventEngine = body.eventEngine;

    await db.update(projects)
        .set({ extraConfig: updatedConfig })
        .where(eq(projects.id, projectId));

    return NextResponse.json({ success: true, extraConfig: updatedConfig });
}

// GET /api/v1/projects/[projectId]/admin/config - Return current extra_config
export async function GET(request: Request, { params }: RouteParams) {
    const { projectId: projectIdStr } = await params;
    const projectId = Number(projectIdStr);

    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;
    if (!walletAddress) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const [project] = await db.select({ id: projects.id, extraConfig: projects.extraConfig, applicantWalletAddress: projects.applicantWalletAddress })
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

    return NextResponse.json({ extraConfig: project.extraConfig });
}
