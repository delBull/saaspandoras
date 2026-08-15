import { db } from './apps/dashboard/src/db';
import { hermesKnowledge } from './apps/dashboard/src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const data = await db.select().from(hermesKnowledge).where(eq(hermesKnowledge.dimension, 'policy')).limit(5);
  console.log(data);
  process.exit(0);
}
main();
