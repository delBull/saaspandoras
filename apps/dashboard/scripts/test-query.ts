import { db } from '@saasfly/db-core';
import { eq } from "@saasfly/db-core";
import { nexusCollaborators } from '@saasfly/db-core/schema';

async function main() {
  const telegramUserId = '798431743';
  const collaborator = await db.query.nexusCollaborators.findFirst({
    where: eq(nexusCollaborators.telegramUserId, telegramUserId),
  });
  console.log("Result:", collaborator);
  process.exit(0);
}
main();
