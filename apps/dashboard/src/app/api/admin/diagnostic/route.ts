/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Información básica sin autenticación
    const _basicInfo = {
      timestamp: new Date().toISOString(),
      message: "Sistema de diagnóstico - Datos resumidos"
    };

    const _detailedInfo = null;
    let _userIsAdmin = false;

    // Intentar obtener información detallada solo si está autenticado
    try {
      const { session } = await getAuth();
      _userIsAdmin = await isAdmin(session?.userId);

      if (_userIsAdmin) {
        console.log('🔍 Running detailed database diagnostic...');
        // Información detallada aquí
      } else {
        console.log('🔍 Running basic database diagnostic...');
      }
    } catch (authError) {
      console.log('Not authenticated for detailed diagnostic, showing basic info');
    }

    // Verificar todas las tablas disponibles
    const tablesQuery = await db.execute(sql`
      SELECT table_name, table_schema, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
      ORDER BY table_name
    `);

    console.log('Available tables:', tablesQuery);

    // Contar registros en cada tabla
    const tableCounts: { table: string; count: number }[] = [];

    for (const table of tablesQuery) {
      try {
        const countQuery = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${(table as any).table_name}"`));
        const count = Number(countQuery[0]?.count as string) || 0;
        tableCounts.push({ table: (table as any).table_name, count });
      } catch (countError) {
        console.warn(`Could not count ${(table as any).table_name}:`, countError);
        tableCounts.push({ table: (table as any).table_name, count: -1 });
      }
    }

    // Verificar estructura de tabla projects específicamente
    let projectsStructure = null;
    try {
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'projects' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      projectsStructure = columns.map((col: any) => ({
        column: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable,
        default: col.column_default
      }));
    } catch (error) {
      console.warn('Could not get projects structure:', error);
    }

    // Verificar algunos proyectos de ejemplo
    let sampleProjects = null;
    try {
      const projects = await db.execute(sql`
        SELECT id, title, "applicant_email", status FROM projects LIMIT 3
      `);
      sampleProjects = projects;
    } catch (error) {
      console.warn('Could not get sample projects:', error);
    }

    // Verificar usuarios y sus proyectos
    let usersWithProjects = null;
    try {
      const users = await db.execute(sql`
        SELECT
          "id",
          "walletAddress",
          "email",
          "connectionCount"
        FROM "User"
        LIMIT 3
      `);
      usersWithProjects = users;
    } catch (error) {
      console.warn('Could not get users with projects:', error);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tables: tableCounts,
      allTables: tablesQuery,
      projects: {
        structure: projectsStructure,
        sample: sampleProjects
      },
      users: usersWithProjects
    });

  } catch (error) {
    console.error("Diagnostic error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
