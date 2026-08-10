import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

async function check() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    const migrations = await sql`SELECT * FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 5;`;
    console.log('Applied Migrations in Production:');
    migrations.forEach(row => console.log(row));

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('outbox_events', 'execution_records', 'mission_events', 'operational_intents');
    `;
    console.log('\nFound Target Tables:');
    tables.forEach(row => console.log(row.table_name));
    
  } catch(e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}
check();
