import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local'), override: true });

const url = process.env.DATABASE_URL || 'postgresql://Marco@localhost:5432/pandoras_local';

const sql = postgres(url, {
  ssl: url.includes('supabase') || url.includes('neon') ? 'require' : false
});

async function probe() {
  console.log(`🚀 Probing for marketing_leads in ${url}...`);
  
  try {
    const res = await sql`SELECT count(*) FROM marketing_leads`;
    console.log(`✅ Table exists! Count: ${res[0].count}`);
  } catch (error) {
    console.log(`❌ Table marketing_leads does NOT exist or error: ${error.message}`);
  }

  try {
    const res = await sql`SELECT n.nspname as schema, c.relname as table 
                          FROM pg_class c 
                          JOIN pg_namespace n ON n.oid = c.relnamespace 
                          WHERE c.relname = 'marketing_leads'`;
    console.log('📋 pg_class check:');
    res.forEach(row => console.log(`- ${row.schema}.${row.table}`));
  } catch (error) {
    console.error(`❌ pg_class check failed:`, error.message);
  }

  process.exit(0);
}

probe().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
