import postgres from 'postgres';

const DATABASE_URL_MAIN = "postgresql://neondb_owner:npg_MjazsA5ybWQ3@ep-summer-bread-adqdsnx4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log("Connecting to Production Database...");
  const sql = postgres(DATABASE_URL_MAIN, { ssl: { rejectUnauthorized: false } });
  
  try {
    const rows = await sql`
      SELECT id, title, slug, is_deleted, status, license_contract_address, chain_id
      FROM projects
      ORDER BY id ASC
    `;
    console.log("All projects in Production DB:", JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error("Error querying Production DB:", error);
  } finally {
    await sql.end();
  }
}

main();
