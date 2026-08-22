import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sqlFile = path.join(process.cwd(), 'drizzle/0032_hermes_data_plane_isolation_k22.sql');
const content = fs.readFileSync(sqlFile, 'utf-8');

const dbUrl = process.env.DATABASE_URL!;
const sql = postgres(dbUrl, { ssl: 'require' });

async function run() {
  console.log('🚀 Executing Migration 0032 (K22 Tenant Session Function)...');
  await sql.unsafe(content);
  console.log('✅ Migration 0032 applied successfully to Neon DB!');
  await sql.end();
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
