import { db } from '@saasfly/db-core';
import { sql } from "@saasfly/db-core";

async function main() {
  const res = await db.execute(sql`SELECT id, name, email, telegram_user_id FROM nexus_collaborators`);
  console.log(res);
  process.exit(0);
}
main();
