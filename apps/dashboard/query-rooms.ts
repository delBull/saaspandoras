import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function run() {
  const info = await db.execute(sql`
    SELECT id, public_id, title, counterparty, relation, kind, status
    FROM nexus_deal_rooms
  `);
  console.log("All Rooms:", JSON.stringify(info, null, 2));
}
run().catch(console.error).finally(() => process.exit(0));
