import { db } from './apps/dashboard/src/db';
import { marketingLeads } from './apps/dashboard/src/db/schema';
import { gt } from 'drizzle-orm';

async function cleanup() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  console.log('Cleaning leads created after:', twoHoursAgo.toISOString());
  
  const result = await db.delete(marketingLeads)
    .where(gt(marketingLeads.createdAt, twoHoursAgo));
  
  console.log('Cleanup result:', result);
  process.exit(0);
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
