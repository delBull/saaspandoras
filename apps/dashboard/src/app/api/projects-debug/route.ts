import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// Type for database query result
interface DebugProjectQueryResult {
  id: number | string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  created_at: string | Date;
}

// Type for formatted debug project response
interface DebugProjectResponse {
  id: number | string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  url: string;
}

export async function GET() {
  try {
    console.log('🔍 DEBUG API: Checking project slugs...');

    const realProjects = await db.execute(sql`
      SELECT
        "id",
        "title",
        "slug",
        "status",
        "featured",
        "created_at"
      FROM "projects"
      ORDER BY "created_at" DESC
    `);

    const projects = realProjects as unknown as DebugProjectQueryResult[];
    console.log(`✅ DEBUG API: Found ${projects.length} projects in database`);

    const projectSlugs: DebugProjectResponse[] = projects.map((p: DebugProjectQueryResult): DebugProjectResponse => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      featured: p.featured,
      url: `/projects/${p.slug}`
    }));

    return NextResponse.json({
      success: true,
      total_projects: projects.length,
      available_slugs: projectSlugs.map(p => p.slug),
      projects: projectSlugs,
      message: "Use these slugs to access real projects"
    });

  } catch (error) {
    console.error("💥 DEBUG API ERROR:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
