import { db } from '../src/db/index';
import { eq } from 'drizzle-orm';
import { nexusCollaborators } from '../src/db/schema';

async function main() {
  const telegramUserId = '798431743';
  const collaborator = await db.query.nexusCollaborators.findFirst({
    where: eq(nexusCollaborators.telegramUserId, telegramUserId),
  });
  console.log("Result:", collaborator);
  process.exit(0);
}
main();
