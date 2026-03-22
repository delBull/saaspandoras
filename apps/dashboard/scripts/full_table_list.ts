import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function listTables() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name ASC
    `);
    
    console.log('--- Listado Completo de Tablas ---');
    console.table(result);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listTables();
