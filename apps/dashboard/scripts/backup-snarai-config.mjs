const { Client } = require('pg');
require('dotenv').config({ path: '.env.staging' });
const fs = require('fs');

async function run() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const res = await c.query("SELECT * FROM projects WHERE slug = 'snarai' LIMIT 1");
  const prods = await c.query("SELECT * FROM installed_products WHERE project_id = (SELECT id FROM projects WHERE slug = 'snarai' LIMIT 1)");
  fs.writeFileSync('snarai_backup.json', JSON.stringify({ project: res.rows[0], products: prods.rows }, null, 2));
  console.log('Backed up to snarai_backup.json');
  await c.end();
}
run().catch(console.error);
