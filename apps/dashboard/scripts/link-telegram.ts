import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const result = await db.execute(sql`
      UPDATE nexus_collaborators
      SET telegram_user_id = '798431743', telegram_username = 'deltoro'
      WHERE user_id = (SELECT id FROM users WHERE email ILIKE '%marco%' LIMIT 1);
    `);
    console.log("Updated collabs:", result);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
main();
