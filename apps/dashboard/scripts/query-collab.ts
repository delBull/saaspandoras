import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`SELECT id, name, email, telegram_user_id FROM nexus_collaborators`);
  console.log(res);
  process.exit(0);
}
main();
