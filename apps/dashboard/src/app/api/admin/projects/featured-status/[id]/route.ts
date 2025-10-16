import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects as projectsSchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";

interface FeaturedUpdateRequest {
  featured?: boolean;
  featuredButtonText?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 Featured-Status API: Starting PATCH request');

    // Verify admin access
    const { session } = await getAuth(await headers());
    const userIsAdmin = await isAdmin(session?.userId);

    if (!userIsAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = Number(id);
    console.log('🚀 Featured-Status API: Project ID:', projectId);

    if (isNaN(projectId)) {
      return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
    }

    const body = await request.json() as FeaturedUpdateRequest;
    console.log('🚀 Featured-Status API: Request body:', body);
    const { featured, featuredButtonText } = body;

    const updateData: { featured?: boolean; featuredButtonText?: string } = {};
    if (typeof featured === 'boolean') {
      updateData.featured = featured;
      console.log('🚀 Featured-Status API: Setting featured to:', featured);
    }
    if (featuredButtonText !== undefined) {
      updateData.featuredButtonText = featuredButtonText;
      console.log('🚀 Featured-Status API: Setting featuredButtonText to:', featuredButtonText);
    }

    // Verificar que el proyecto existe
    const existingProject = await db.query.projects.findFirst({
      where: eq(projectsSchema.id, projectId),
    });

    if (!existingProject) {
      console.log('🚀 Featured-Status API: Project not found');
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    console.log('🚀 Featured-Status API: Existing project featured status:', existingProject.featured);

    // Actualizar featured status - simplified query
    const [updatedProject] = await db
      .update(projectsSchema)
      .set(updateData)
      .where(eq(projectsSchema.id, projectId))
      .returning({
        id: projectsSchema.id,
        title: projectsSchema.title,
        slug: projectsSchema.slug,
        featured: projectsSchema.featured,
        featuredButtonText: projectsSchema.featuredButtonText,
        status: projectsSchema.status
      });

    console.log('🚀 Featured-Status API: Update successful:', updatedProject);

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error('🚀 Featured-Status API: Error updating featured status:', error);
    console.error('🚀 Featured-Status API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Failed to update featured status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}