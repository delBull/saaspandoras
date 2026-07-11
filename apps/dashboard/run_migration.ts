import { Pool } from 'pg';
import * as fs from 'fs';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = fs.readFileSync('drizzle/0009_breezy_gorilla_man.sql', 'utf8');
  try {
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration successful!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await pool.end();
  }
}
main();
