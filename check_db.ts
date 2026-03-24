import { db } from './apps/dashboard/src/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  try {
    console.log('🔍 Checking projects table schema...');
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);
    console.log('📊 Columns found:', JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
