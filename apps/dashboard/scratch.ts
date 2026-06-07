import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query('SELECT token_price_usd, phases FROM projects WHERE id = 2');
  console.log(JSON.stringify(res.rows[0], null, 2));
  process.exit(0);
}
main();
