import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function inspectSchema() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('--- Tablas en el esquema PUBLIC ---');
    console.table(result);
    process.exit(0);
  } catch (error) {
    console.error('Error al inspeccionar esquema:', error);
    process.exit(1);
  }
}

inspectSchema();
