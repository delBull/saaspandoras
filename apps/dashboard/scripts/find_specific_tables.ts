import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function findTables() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND (table_name LIKE '%lead%' OR table_name LIKE '%project%' OR table_name LIKE '%course%' OR table_name LIKE '%admin%')
      ORDER BY table_name ASC
    `);
    
    console.log('--- Tablas Relacionadas Encontradas ---');
    console.table(result);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findTables();
