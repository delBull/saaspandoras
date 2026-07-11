import postgres from 'postgres';

async function main() {
  const sql = postgres("postgresql://neondb_owner:npg_i8kHcf5YnSRx@ep-dawn-sea-anegc8ni-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require", {
    ssl: { rejectUnauthorized: false }
  });

  console.log("Connected!");
  
  const res = await sql`SELECT * FROM ambassadors WHERE wallet_address ILIKE ${'%' + '0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9' + '%'} OR email ILIKE '%mario%' OR email ILIKE '%marco%' OR full_name ILIKE '%mario%' OR full_name ILIKE '%marco%'`;
  console.table(res);

  const count = await sql`SELECT COUNT(*) FROM ambassadors`;
  console.log("Total ambassadors:", count[0].count);

  process.exit(0);
}

main().catch(console.error);
