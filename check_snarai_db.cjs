const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:n8.pg3L4DcaT5yP9wX8sZg36oHk1Q6N9@ep-dawn-sea-anegc8ni-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require' });

pool.query("SELECT id, slug, title, logo_url, landing_config FROM projects WHERE slug='snarai'", (err, res) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(res.rows[0], null, 2));
  pool.end();
});
