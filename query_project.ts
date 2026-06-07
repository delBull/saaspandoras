import { db } from './apps/dashboard/src/db';
import { projects } from './apps/dashboard/src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const p = await db.query.projects.findFirst({ where: eq(projects.slug, 'snarai') });
  console.log({ logoUrl: p?.logoUrl, imageUrl: p?.imageUrl });
  process.exit(0);
}
main();
