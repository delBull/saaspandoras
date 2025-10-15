import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic'; // Asegura que la ruta sea siempre dinámica

export async function GET() {
  try {
    console.log('🔍 Public API: Starting GET request...');

    // Test database connection first - handle quota exceeded gracefully
    try {
      await db.execute(sql`SELECT 1`);
      console.log('✅ Public API: Database connection test passed');
    } catch (dbError) {
      console.error('❌ Public API: Database connection failed:', dbError);

      // Check if it's a quota issue
      if (dbError instanceof Error && dbError.message.includes('quota')) {
        return NextResponse.json(
          {
            message: "Database quota exceeded",
            error: "Your database plan has reached its data transfer limit. Please upgrade your plan or contact support.",
            quotaExceeded: true
          },
          { status: 503 } // Service Unavailable
        );
      }

      return NextResponse.json(
        { message: "Database connection failed", error: dbError instanceof Error ? dbError.message : 'Unknown DB error' },
        { status: 500 }
      );
    }

    console.log('🔍 Public API: Fetching projects from database...');

    // Try optimized query with essential fields only
    try {
      console.log('🔍 Public API: Executing optimized query with essential fields...');
      const optimizedProjects = await db.execute(sql`
        SELECT id, title, description, status, created_at, business_category, logo_url, cover_photo_url
        FROM projects
        WHERE status IN ('pending', 'approved', 'live', 'completed')
        ORDER BY created_at DESC
        LIMIT 3
      `);

      console.log(`📊 Public API: Found ${optimizedProjects.length} projects with optimized query`);

      if (optimizedProjects.length > 0) {
        console.log('📊 Public API: First project sample:', optimizedProjects[0]);
      }

      return NextResponse.json(optimizedProjects);
    } catch (queryError) {
      console.error('❌ Public API: Simple query failed, trying diagnostic query:', queryError);

      // Try diagnostic queries
      try {
        const basicQuery = await db.execute(sql`SELECT 1 as test`);
        console.log('📊 Public API: Basic query works:', basicQuery[0]);

        // Try to check if projects table exists
        const tableCheck = await db.execute(sql`
          SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'projects'
        `);
        console.log('📊 Public API: Projects table exists:', tableCheck.length > 0);

        return NextResponse.json({
          message: "Database connection works but projects query failed",
          basicQuery: basicQuery[0],
          tableExists: tableCheck.length > 0,
          error: queryError instanceof Error ? queryError.message : 'Unknown error'
        });
      } catch (basicError) {
        console.error('❌ Public API: Even basic query failed:', basicError);
        return NextResponse.json(
          {
            message: "Database connection failed",
            error: basicError instanceof Error ? basicError.message : 'Unknown error'
          },
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