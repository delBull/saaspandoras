import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function fixOutbox() {
  try {
    await db.execute(sql`
      ALTER TABLE outbox_events 
      ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone, 
      ADD COLUMN IF NOT EXISTS locked_by varchar(255);
    `);
    console.log("Added locked_at and locked_by to outbox_events");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixOutbox();
