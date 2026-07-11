import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projects, projectDocuments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';

type RouteParams = { params: Promise<{ projectId: string }> };

// GET /api/v1/projects/[projectId]/admin/documents
export async function GET(request: Request, { params }: RouteParams) {
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

    const [project] = await db.select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const documents = await db.select()
        .from(projectDocuments)
        .where(eq(projectDocuments.projectId, projectId))
        .orderBy(desc(projectDocuments.createdAt));

    return NextResponse.json({ documents });
}

// POST /api/v1/projects/[projectId]/admin/documents
export async function POST(request: Request, { params }: RouteParams) {
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
    const {
        title,
        description,
        documentType,
        category,
        status,
        verificationStatus,
        visibility,
        url,
        storageProvider,
        fileType,
        metadata
    } = body;

    if (!title || !documentType || !category) {
        return NextResponse.json({ error: 'Faltan campos obligatorios (title, documentType, category)' }, { status: 400 });
    }

    const [project] = await db.select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const [newDocument] = await db.insert(projectDocuments).values({
        projectId,
        title,
        description: description || null,
        documentType,
        category,
        status: status || 'DRAFT',
        verificationStatus: verificationStatus || 'NOT_VERIFIED',
        visibility: visibility || 'ADMIN',
        fileUrl: url || '',
        storageProvider: storageProvider || 'external',
        fileType: fileType || 'external_link',
    }).returning();

    return NextResponse.json({ success: true, document: newDocument });
}
