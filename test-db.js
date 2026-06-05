require('dotenv').config({path: 'apps/dashboard/.env.local'});
const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT logo_url, image_url, cover_photo_url, legal_config FROM projects WHERE slug = 'snarai'`;
  console.log(JSON.stringify(result, null, 2));
}
main();
