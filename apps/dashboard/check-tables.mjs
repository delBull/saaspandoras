import postgres from 'postgres';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  console.log("🔍 Checking tables...");
  
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("📊 Tables found:", tables.map(t => t.table_name).join(", "));
  } catch (err) {
    console.error("❌ Failed to list tables:", err);
  } finally {
    await sql.end();
  }
}

run();
