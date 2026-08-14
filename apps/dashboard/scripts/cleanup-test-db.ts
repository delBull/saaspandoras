import { db } from '../src/db/index';
import { hermesConversationMessages, hermesConversations } from '../src/db/schema';
import { inArray } from 'drizzle-orm';

async function main() {
  const orgs = ['org_rt_test', 'org_rt_stream_test'];
  await db.delete(hermesConversationMessages).where(inArray(hermesConversationMessages.organizationId, orgs));
  await db.delete(hermesConversations).where(inArray(hermesConversations.organizationId, orgs));
  console.log('Cleanup done');
  process.exit(0);
}
main();
