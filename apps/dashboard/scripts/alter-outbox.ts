import { db } from '~/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Altering outbox_events table...");
  try {
    await db.execute(sql`
      ALTER TABLE outbox_events 
      ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS locked_by VARCHAR(255);
    `);
    console.log("Successfully added locked_at and locked_by to outbox_events.");
  } catch (error) {
    console.error("Failed to alter table:", error);
  }
  process.exit(0);
}

main();
