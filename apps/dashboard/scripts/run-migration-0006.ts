import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Bun will automatically load .env, but we can also rely on process.env.DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const sql = fs.readFileSync(path.join(process.cwd(), 'drizzle/0006_modern_war_machine.sql'), 'utf-8');
    const statements = sql.split('--> statement-breakpoint').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      try {
        console.log('Executing:', statement.trim());
        await pool.query(statement);
        console.log('✅ Success\n');
      } catch (e: any) {
        if (e.message.includes('already exists')) {
          console.log('⚠️ Already exists (Skipping)\n');
        } else {
          console.error('❌ Error:', e.message, '\n');
        }
      }
    }
  } catch (error) {
    console.error('Failed to read migration file:', error);
  } finally {
    await pool.end();
  }
}

run();
