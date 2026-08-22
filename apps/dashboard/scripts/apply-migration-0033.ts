import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sqlFile = path.join(process.cwd(), 'drizzle/0033_k22_real_rls_and_role.sql');
const content = fs.readFileSync(sqlFile, 'utf-8');

const dbUrl = process.env.DATABASE_URL!;
const sql = postgres(dbUrl, { ssl: 'require' });

async function run() {
  console.log('🚀 Executing Migration 0033 (Real RLS, Roles & HMAC Store)...');
  await sql.unsafe(content);
  console.log('✅ Migration 0033 applied successfully to Neon DB!');

  // Verify RLS is now enabled
  const rlsCheck = await sql`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE tablename LIKE 'hermes_%'
    ORDER BY tablename;
  `;
  console.log('📊 RLS Status on hermes_* tables:');
  for (const r of rlsCheck) {
    console.log(`  - ${r.tablename}: rowsecurity = ${r.rowsecurity}`);
  }

  await sql.end();
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
