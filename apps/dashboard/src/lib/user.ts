import { db } from "~/db";
import { sql } from "drizzle-orm";

export async function ensureUser(walletAddress: string) {
  const [user] = await db.execute(sql`
    SELECT "id" FROM "User"
    WHERE LOWER("walletAddress") = LOWER(${walletAddress})
    LIMIT 1
  `);

  if (user) return user;

  const [newUser] = await db.execute(sql`
    INSERT INTO "User" ("walletAddress", "createdAt")
    VALUES (LOWER(${walletAddress}), NOW())
    RETURNING "id"
  `);

  return newUser;
}
