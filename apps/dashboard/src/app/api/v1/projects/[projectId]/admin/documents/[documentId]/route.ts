import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projects, projectDocuments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';

type RouteParams = { params: Promise<{ projectId: string, documentId: string }> };

// PATCH /api/v1/projects/[projectId]/admin/documents/[documentId]
export async function PATCH(request: Request, { params }: RouteParams) {
    const { projectId: projectIdStr, documentId } = await params;
    const projectId = Number(projectIdStr);

    if (isNaN(projectId)) {
        return NextResponse.json({ error: 'ID de proyecto inválido' }, { status: 400 });
    }

    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;
    if (!walletAddress) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate project existence
    const [project] = await db.select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Verify document belongs to project
    const [existingDoc] = await db.select()
        .from(projectDocuments)
        .where(and(
            eq(projectDocuments.id, Number(documentId)),
            eq(projectDocuments.projectId, projectId)
        ));

    if (!existingDoc) {
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.documentType !== undefined) updateData.documentType = body.documentType;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.verificationStatus !== undefined) updateData.verificationStatus = body.verificationStatus;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl;
    if (body.url !== undefined) updateData.fileUrl = body.url; // Support old frontend payload if applicable
    if (body.storageProvider !== undefined) updateData.storageProvider = body.storageProvider;
    if (body.fileType !== undefined) updateData.fileType = body.fileType;
    
    updateData.updatedAt = new Date();

    const [updatedDocument] = await db.update(projectDocuments)
        .set(updateData)
        .where(eq(projectDocuments.id, Number(documentId)))
        .returning();

    return NextResponse.json({ success: true, document: updatedDocument });
}

// DELETE /api/v1/projects/[projectId]/admin/documents/[documentId]
export async function DELETE(request: Request, { params }: RouteParams) {
    const { projectId: projectIdStr, documentId } = await params;
    const projectId = Number(projectIdStr);

    if (isNaN(projectId)) {
        return NextResponse.json({ error: 'ID de proyecto inválido' }, { status: 400 });
    }

    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;
    if (!walletAddress) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Validate project existence
    const [project] = await db.select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const [deletedDocument] = await db.delete(projectDocuments)
        .where(and(
            eq(projectDocuments.id, Number(documentId)),
            eq(projectDocuments.projectId, projectId)
        ))
        .returning();

    if (!deletedDocument) {
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: deletedDocument.id });
}
