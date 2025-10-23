import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Simple API: Starting GET request...');

    // Test database connection first
    try {
      const testQuery = await db.execute(sql`SELECT COUNT(*) as count FROM projects`);
      console.log('✅ Simple API: Database connection test passed, projects count:', testQuery[0]);
    } catch (dbError) {
      console.error('❌ Simple API: Database connection failed:', dbError);
      return NextResponse.json(
        { message: "Database connection failed", error: dbError instanceof Error ? dbError.message : 'Unknown DB error' },
        { status: 500 }
      );
    }

    // Try simple query with only basic fields
    try {
      const projects = await db.execute(sql`
        SELECT id, title, description, slug, status, created_at
        FROM projects
        WHERE status IN ('pending', 'approved', 'live', 'completed')
        ORDER BY created_at DESC
      `);

      console.log(`📊 Simple API: Found ${projects.length} projects`);
      return NextResponse.json(projects);
    } catch (queryError) {
      console.error('❌ Simple API: Query failed:', queryError);
      return NextResponse.json(
        { message: "Query failed", error: queryError instanceof Error ? queryError.message : 'Unknown query error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("💥 Simple API: Critical error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}