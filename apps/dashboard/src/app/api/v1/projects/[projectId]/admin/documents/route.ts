import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projects, projectDocuments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuth, isAdmin } from '@/lib/auth';

type RouteParams = { params: Promise<{ projectId: string }> };

// Authorize project owner OR platform admin.
async function authorizeProjectAccess(project: { applicantWalletAddress: string | null }): Promise<{ authorized: false; errorResponse: NextResponse } | { authorized: true; walletAddress: string }> {
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;
    if (!walletAddress) {
        return { authorized: false, errorResponse: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
    }

    const isOwner = project.applicantWalletAddress?.toLowerCase() === walletAddress.toLowerCase();
    if (isOwner) {
        return { authorized: true, walletAddress };
    }

    const isPlatformAdmin = await isAdmin(walletAddress);
    if (isPlatformAdmin) {
        return { authorized: true, walletAddress };
    }

    return { authorized: false, errorResponse: NextResponse.json({ error: 'No tienes permisos para este proyecto' }, { status: 403 }) };
}

// GET /api/v1/projects/[projectId]/admin/documents
export async function GET(request: Request, { params }: RouteParams) {
    const { projectId: projectIdStr } = await params;
    const projectId = Number(projectIdStr);

    if (isNaN(projectId)) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const [project] = await db.select({ id: projects.id, applicantWalletAddress: projects.applicantWalletAddress })
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const access = await authorizeProjectAccess(project);
    if (!access.authorized) {
        return access.errorResponse;
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

    const [project] = await db.select({ id: projects.id, applicantWalletAddress: projects.applicantWalletAddress })
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const access = await authorizeProjectAccess(project);
    if (!access.authorized) {
        return access.errorResponse;
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
