import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { inArray, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic'; // Asegura que la ruta sea siempre dinámica

export async function GET() {
  try {
    console.log('🔍 Public API: Starting GET request...');

    // Test database connection first
    try {
      const testQuery = await db.execute(sql`SELECT COUNT(*) as count FROM projects`);
      console.log('✅ Public API: Database connection test passed, projects count:', testQuery[0]);
    } catch (dbError) {
      console.error('❌ Public API: Database connection failed:', dbError);
      return NextResponse.json(
        { message: "Database connection failed", error: dbError instanceof Error ? dbError.message : 'Unknown DB error' },
        { status: 500 }
      );
    }

    console.log('🔍 Public API: Fetching projects from database...');

    // Try simple query with basic fields first
    try {
      const projects = await db.query.projects.findMany({
        where: inArray(projectsSchema.status, ["pending", "approved", "live", "completed"]),
        orderBy: (projects, { desc }) => [desc(projects.createdAt)],
        columns: {
          // Basic info
          id: true,
          title: true,
          description: true,
          slug: true,
          status: true,
          createdAt: true,
          coverPhotoUrl: true,
          targetAmount: true,
          // Applicant info - CRITICAL for ownership display
          applicantWalletAddress: true, // ✅ AGREGADO - Campo faltante
          applicantName: true,
          applicantEmail: true,
        }
      });

      console.log(`📊 Public API: Found ${projects.length} projects`);
      console.log('📊 Public API: Projects data:', projects.slice(0, 2)); // Log first 2 projects

      return NextResponse.json(projects);
    } catch (queryError) {
      console.error('❌ Public API: Drizzle query failed, trying raw SQL:', queryError);

      // Fallback to raw SQL query
      try {
        const rawProjects = await db.execute(sql`
          SELECT id, title, description, slug, status, created_at, cover_photo_url, target_amount,
                 applicant_wallet_address, applicant_name, applicant_email
          FROM projects
          WHERE status IN ('pending', 'approved', 'live', 'completed')
          ORDER BY created_at DESC
        `);

        console.log(`📊 Public API: Raw SQL found ${rawProjects.length} projects`);
        return NextResponse.json(rawProjects);
      } catch (rawError) {
        console.error('❌ Public API: Raw SQL also failed:', rawError);
        return NextResponse.json(
          { message: "Query failed", error: rawError instanceof Error ? rawError.message : 'Unknown query error' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("💥 Public API: Critical error:", error);
    console.error("💥 Public API: Error stack:", error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}