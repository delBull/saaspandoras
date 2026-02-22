import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@/lib/auth";

// GET - Obtener todos los proyectos featured
export async function GET() {
  try {
    console.log('🎯 Featured API: Getting featured projects from database');

    const featuredProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        slug: projects.slug,
        status: projects.status,
        featured: projects.featured,
        featuredButtonText: projects.featuredButtonText,
        coverPhotoUrl: projects.coverPhotoUrl,
        logoUrl: projects.logoUrl,
        tagline: projects.tagline,
        targetAmount: projects.targetAmount,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(and(eq(projects.featured, true), eq(projects.status, 'approved')))
      .orderBy(projects.id);

    console.log(`🎯 Featured API: Found ${featuredProjects.length} featured projects`);


    return NextResponse.json(featuredProjects);
  } catch (error) {
    console.error('❌ Featured API Error:', error);
    return NextResponse.json(
      { message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Actualizar el estado featured de un proyecto (Admin only)
export async function POST(request: Request) {
  try {
    const { session } = await getAuth(await headers());
    const userIsAdmin = session?.address?.toLowerCase() === process.env.SUPER_ADMIN_WALLET?.toLowerCase() ||
      process.env.ADMIN_WALLETS?.split(',').includes(session?.address?.toLowerCase() ?? '');

    if (!userIsAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const body = await request.json() as { projectId: number; featured: boolean; featuredButtonText?: string };
    const { projectId, featured, featuredButtonText } = body;

    if (!projectId) {
      return NextResponse.json({ message: "projectId requerido" }, { status: 400 });
    }

    console.log('🔧 Featured API: Updating project', projectId, 'featured:', featured);

    const updateData: Partial<typeof projects.$inferSelect> = {
      featured,
      featuredButtonText: featuredButtonText ?? null,
    };

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning({
        id: projects.id,
        title: projects.title,
        featured: projects.featured,
        featuredButtonText: projects.featuredButtonText,
      });

    if (!updatedProject) {
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    console.log('✅ Featured API: Updated project successfully:', updatedProject);

    return NextResponse.json({
      message: `Proyecto ${featured ? 'marcado como featured' : 'removido de featured'}`,
      project: updatedProject
    });

  } catch (error) {
    console.error('❌ Featured API Error:', error);
    return NextResponse.json(
      { message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
