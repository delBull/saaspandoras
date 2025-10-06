import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// Type for database query result
interface ProjectQueryResult {
  id: number | string;
  title: string;
  description: string;
  status: string;
  slug: string;
  createdAt: string | Date;
  coverPhotoUrl?: string | null;
  targetAmount?: string | number | null;
  raisedAmount?: string | number | null;
}

// Type for formatted project response
interface FormattedProject {
  id: number;
  title: string;
  description: string;
  slug: string;
  status: string;
  createdAt: string | Date;
  coverPhotoUrl: string;
  targetAmount: string | null;
  raisedAmount: string;
}

export async function GET() {
  try {
    console.log('🔍 Basic API: Loading REAL projects from database...');

    // First, try to get real projects from database
    try {
      console.log('🔍 Basic API: Executing database query...');
      const realProjects = await db.execute(sql`
        SELECT
          "id",
          "title",
          "description",
          "status",
          "slug",
          "created_at" as "createdAt",
          "cover_photo_url" as "coverPhotoUrl",
          "target_amount" as "targetAmount",
          "raised_amount" as "raisedAmount"
        FROM "projects"
        ORDER BY "created_at" DESC
      `);

      const projects = realProjects as unknown as ProjectQueryResult[];
      console.log(`✅ Basic API: Found ${projects.length} real projects in database`);
      console.log('🔍 Basic API: Real project IDs and titles:', projects.map(p => ({ id: p.id, title: p.title, slug: p.slug })));

      if (projects.length > 0) {
        const formattedProjects: FormattedProject[] = projects.map((project: ProjectQueryResult): FormattedProject => ({
          id: Number(project.id),
          title: project.title,
          description: project.description,
          slug: project.slug,
          status: project.status,
          createdAt: project.createdAt,
          coverPhotoUrl: project.coverPhotoUrl ?? '/images/default-project.jpg',
          targetAmount: project.targetAmount ? String(project.targetAmount) : null,
          raisedAmount: project.raisedAmount ? String(project.raisedAmount) : '0'
        }));

        console.log('📊 Basic API: Returning real projects from database');
        console.log('📊 Available slugs:', formattedProjects.map(p => p.slug));
        return NextResponse.json(formattedProjects);
      }

    } catch (dbError) {
      console.error('❌ Basic API: Database query failed, falling back to hardcoded data:', dbError);
      console.error('❌ Basic API: Error details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });
    }

    // Fallback to hardcoded data (like before) but as backup
    console.log('📊 Basic API: No real projects found, using template data for testing');

    const fallbackProjects = [
      {
        id: Math.floor(Math.random() * 10000) + 1000, // Random ID to avoid conflicts
        title: 'Verifica tus proyectos en admin',
        description: 'Para ver tus proyectos reales, dirígete a admin dashboard y verifica que estén publicados.',
        slug: 'verificacion-admin-' + Date.now(),
        status: 'draft', // Mark as draft so they understand they're not real
        createdAt: new Date().toISOString(),
        coverPhotoUrl: '/images/default-project.jpg',
        targetAmount: '0',
        raisedAmount: '0'
      }
    ];

    return NextResponse.json(fallbackProjects);
  } catch (error) {
    console.error("💥 Basic API: Critical error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
