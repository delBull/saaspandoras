import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nexusCollaborators, users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  const allCollabs = await db.select({
    id: nexusCollaborators.id,
    userId: nexusCollaborators.userId,
    email: users.email
  }).from(nexusCollaborators).leftJoin(users, eq(users.id, nexusCollaborators.userId));

  console.log("Collabs found:");
  console.dir(allCollabs, { depth: null });

  // Update Marco's collabs
  const marcoCollabs = allCollabs.filter(c => c.email && c.email.toLowerCase().includes('marco') || c.email && c.email.toLowerCase().includes('deltoro') || c.email && c.email.toLowerCase().includes('pandoras'));
  
  if (marcoCollabs.length > 0) {
    console.log("Updating telegram for:", marcoCollabs[0].email);
    await db.update(nexusCollaborators)
      .set({ telegramUserId: "798431743", telegramUsername: "deltoro" })
      .where(eq(nexusCollaborators.userId, marcoCollabs[0].userId));
    console.log("Updated!");
  }
  
  process.exit(0);
}
main();
