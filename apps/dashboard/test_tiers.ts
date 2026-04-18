import { db } from './src/db';
import { projects } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const p = await db.query.projects.findFirst({
    where: eq(projects.slug, 'narai')
  });
  console.log("NARAI TIERS:", JSON.stringify(p?.w2eConfig, null, 2));
  process.exit(0);
}
run();
