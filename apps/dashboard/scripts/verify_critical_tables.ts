import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function verifyTables() {
  try {
    const criticalTables = ['projects', 'courses', 'administrators', 'leads', 'course_enrollments'];
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN (${sql.join(criticalTables.map(t => sql.raw(`'${t}'`)), sql.raw(', '))})
    `);
    
    console.log('--- Estado de Tablas Críticas ---');
    console.table(result);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyTables();
