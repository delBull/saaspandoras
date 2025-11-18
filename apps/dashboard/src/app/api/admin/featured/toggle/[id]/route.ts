import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";

// ⚠️ Dynamic imports para evitar problemas de build
let db: any = null;

async function loadDependencies() {
  if (!db) {
    const dbModule = await import("~/db");
    db = dbModule.db;
  }
}

// Force dynamic runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FeaturedUpdateRequest {
  featured?: boolean;
  featuredButtonText?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await loadDependencies();

  try {
    console.log('🚀 Featured-Toggle API: Starting PATCH request');

    // Verify admin access
    const { session } = await getAuth(await headers());
    const userIsAdmin = await isAdmin(session?.userId);

    if (!userIsAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = Number(id);
    console.log('🚀 Featured-Toggle API: Project ID:', projectId);

    if (isNaN(projectId)) {
      return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
    }

    const body = await request.json() as FeaturedUpdateRequest;
    console.log('🚀 Featured-Toggle API: Request body:', body);
    const { featured, featuredButtonText } = body;

    const updateData: { featured?: boolean; featuredButtonText?: string } = {};
    if (typeof featured === 'boolean') {
      updateData.featured = featured;
      console.log('🚀 Featured-Toggle API: Setting featured to:', featured);
    }
    if (featuredButtonText !== undefined) {
      updateData.featuredButtonText = featuredButtonText;
      console.log('🚀 Featured-Toggle API: Setting featuredButtonText to:', featuredButtonText);
    }

    console.log('🚀 Featured-Toggle API: Checking if project exists...');

    // First, let's check what columns actually exist in the database
    try {
      const columnsCheck = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'featured'`);
      console.log('🚀 Featured-Toggle API: Featured column exists:', columnsCheck.length > 0);
    } catch (columnsError) {
      console.error('🚀 Featured-Toggle API: Columns check failed:', columnsError);
    }

    // Verificar que el proyecto existe - use direct query
    const projectCheck = await db.execute(sql`SELECT "id" FROM "projects" WHERE "id" = ${projectId}`);

    if (projectCheck.length === 0) {
      console.log('🚀 Featured-Toggle API: Project not found');
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    console.log('🚀 Featured-Toggle API: Project exists, proceeding with update');

    // Actualizar featured status - simplified query
    console.log('🚀 Featured-Toggle API: Executing UPDATE query...');
    const updateResult = await db.execute(sql`
      UPDATE "projects"
      SET "featured" = ${updateData.featured}
      WHERE "id" = ${projectId}
      RETURNING "id", "title", "slug", "featured", "status"
    `);

    if (updateResult.length === 0) {
      console.log('🚀 Featured-Toggle API: Update failed');
      return NextResponse.json({ message: "Error al actualizar proyecto" }, { status: 500 });
    }

    const updatedProject = updateResult[0] as unknown as {
      id: number;
      title: string;
      slug: string;
      featured: boolean;
      status: string;
    };

    console.log('🚀 Featured-Toggle API: Update successful:', updatedProject);

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error('🚀 Featured-Toggle API: Error updating featured status:', error);
    console.error('🚀 Featured-Toggle API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Failed to update featured status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
