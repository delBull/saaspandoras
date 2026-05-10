import { db } from './apps/dashboard/src/db';
import { projects } from './apps/dashboard/src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const p = await db.query.projects.findFirst({
    where: eq(projects.slug, 'narai')
  });
  console.log(JSON.stringify(p?.w2eConfig, null, 2));
}

main().catch(console.error);
