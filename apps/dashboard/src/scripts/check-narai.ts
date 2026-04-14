import postgres from 'postgres';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkProject() {
  const sql = postgres(DATABASE_URL_STAGING);
  const res = await sql`SELECT id, slug, allowed_domains FROM projects WHERE slug = 'narai'`;
  console.log(JSON.stringify(res, null, 2));
  await sql.end();
}

checkProject().catch(console.error);
