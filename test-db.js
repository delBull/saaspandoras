const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:A7Xb9IayFvJt@ep-dawn-sea-anegc8ni-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require' });
pool.query('SELECT 1 FROM knowledge_sources LIMIT 1')
  .then(() => console.log('TABLE EXISTS'))
  .catch(e => console.error('ERROR:', e.message))
  .finally(() => pool.end());
