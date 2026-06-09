import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const result = await pool.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'projects' 
  ORDER BY ordinal_position
`);
console.log('Projects columns:', result.rows.map((x: any) => x.column_name).join(', '));

// Also check current config/extra columns
const row = await pool.query(`SELECT * FROM projects WHERE slug = 'snarai' LIMIT 1`);
if (row.rows.length > 0) {
  console.log('\nSnarai project keys:', Object.keys(row.rows[0]).join(', '));
}
await pool.end();
