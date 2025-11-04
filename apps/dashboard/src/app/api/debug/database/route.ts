import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Helper function to get table information
async function getTableInfo(tableIndex: number, tableName: string) {
  try {
    // Count query for this table
    const countQuery = await db.execute(sql`SELECT COUNT(*)::text as count FROM ${sql.identifier(tableName)};`);
    const count = (countQuery as any).rows?.[0]?.count || '0';

    // Sample query (first 2 rows)
    const sampleQuery = await db.execute(sql`SELECT * FROM ${sql.identifier(tableName)} LIMIT 2;`);
    const sample = (sampleQuery as any).rows || [];

    return {
      count: parseInt(count),
      has_data: parseInt(count) > 0,
      sample_data: sample,
      columns: sample.length > 0 ? Object.keys(sample[0]) : []
    };
  } catch (err) {
    console.error(`❌ Error getting info for table ${tableName}:`, err);
    return {
      count: 0,
      has_data: false,
      sample_data: [],
      columns: [],
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export async function GET() {
  try {
    console.log('🔍 Fetching database debug information...');

    // First test basic connection
    console.log('🏥 Testing basic database connection...');
    const connectionTest = await db.execute(sql`SELECT 1 as test;`).catch((err) => {
      console.error('❌ Database connection test failed:', err);
      return null;
    });

    if (!connectionTest) {
      throw new Error('Database connection failed');
    }

    console.log('✅ Database connection OK');

    // Get ALL tables and their row counts
    console.log('📋 Getting table overview...');
    const allTables = await db.execute(sql`
      SELECT
        schemaname as schema,
        tablename as table_name,
        'exists' as status
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'information_%'
      AND tablename NOT LIKE '_prisma_%'
      ORDER BY tablename;
    `).catch((err) => {
      console.error('❌ Table overview query failed:', err);
      return { rows: [] };
    });

    console.log('📊 Tables found:', (allTables as any).rows || []);

    // Create a diagnostic report instead of specific table queries
    const debugData = {
      timestamp: new Date().toISOString(),
      database_health: {
        status: 'connected',
        connection_type: 'PostgreSQL',
        migration_status: 'PENDING - Need to run migrations or push schema'
      },
      tables_overview: {
        total_tables: (allTables as any).rows?.length || 0,
        expected_tables: [
          'users', 'projects', 'gamification_profiles',
          'achievements', 'user_achievements', 'user_points',
          'gamification_events', 'administrators', 'user_referrals',
          'rewards', 'user_rewards'
        ] as string[],
        actual_tables: (allTables as any).rows?.map((r: any) => r.table_name) || [],
        missing_tables: [] as string[]
      },
      system_diagnosis: {
        connection_ok: true,
        migrations_needed: true,
        data_population_needed: true,
        message: '⚠️ Base de datos conectada pero faltan tablas y datos. Necesitas ejecutar las migraciones de Drizzle.'
      },
      next_steps: [
        '1. Ejecuta: bun run db:migrate (o db:push:pg si hay conflictos)',
        '2. Importa datos iniciales si los tienes',
        '3. Crea data de prueba para desarrollo',
        '4. Verifica que todas las tablas tengan data'
      ],
      current_tables_data: (() => {
        // For each table that exists, try to get a sample and count
        const existingTables: string[] = (allTables as any).rows?.map((r: any) => r.table_name) || [];

        // Return a promise that resolves with processed table data
        return Promise.all(existingTables.map((tableName: string) => getTableInfo(existingTables.indexOf(tableName), tableName)))
          .then(results => {
            const result: any = {};
            existingTables.forEach((tableName: string, index: number) => {
              result[tableName] = results[index];
            });
            return result;
          })
          .catch((err) => {
            console.error('❌ Error getting table info:', err);
            return {};
          });

      })(),
      server_info: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        debug_logs_enabled: true
      }
    };

    // Wait for the table data promise to resolve
    const finalDebugData = {
      ...debugData,
      current_tables_data: await debugData.current_tables_data
    };

    // Determine missing tables
    finalDebugData.tables_overview.missing_tables = finalDebugData.tables_overview.expected_tables.filter(
      (table: string) => !finalDebugData.tables_overview.actual_tables.includes(table)
    );

    return NextResponse.json({
      success: true,
      message: 'Database diagnostic report generated',
      data: finalDebugData
    });

  } catch (error) {
    console.error('❌ Error fetching database debug information:', error);
    return NextResponse.json({
      success: false,
      message: 'Error retrieving database debug information',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}
