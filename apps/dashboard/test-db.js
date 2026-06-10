const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT * FROM ambassador_commissions LIMIT 1');
    console.log('Success! Table exists.');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}
test();
