import postgres from 'postgres';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:REMOVED_ROTATE_PASSWORD@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  console.log("Connecting to Staging Database...");
  const sql = postgres(DATABASE_URL_STAGING, { ssl: { rejectUnauthorized: false } });
  
  try {
    const rows = await sql`
      SELECT id, title, slug, is_deleted, status, license_contract_address, chain_id, w2e_config
      FROM projects
      ORDER BY id ASC
    `;
    console.log("All projects in Staging DB:", JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error("Error querying Staging DB:", error);
  } finally {
    await sql.end();
  }
}

main();
