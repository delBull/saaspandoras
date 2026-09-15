import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log("Adding columns to nexus_collaborators...");
    await db.execute(sql`ALTER TABLE nexus_collaborators ADD COLUMN IF NOT EXISTS telegram_user_id VARCHAR(64);`);
    await db.execute(sql`ALTER TABLE nexus_collaborators ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(128);`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS nexus_collaborators_telegram_user_id_unique ON nexus_collaborators(telegram_user_id);`);
    console.log("Columns added.");

    console.log("Updating Marco's telegram ID...");
    const result = await db.execute(sql`
      UPDATE nexus_collaborators
      SET telegram_user_id = '798431743', telegram_username = 'deltoro'
      WHERE email ILIKE '%marco%';
    `);
    console.log("Update done:", result);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
main();
