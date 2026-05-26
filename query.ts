import { db } from './apps/dashboard/src/db';
import { projects } from './apps/dashboard/src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const result = await db.select({
    w2eConfig: projects.w2eConfig,
    targetAmount: projects.targetAmount,
    tokenPriceUsd: projects.tokenPriceUsd
  }).from(projects).where(eq(projects.slug, 'snarai'));
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
main().catch(console.error);
