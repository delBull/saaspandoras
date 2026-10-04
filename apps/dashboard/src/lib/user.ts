import { db, users } from "@saasfly/db-core";
import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";

export async function ensureUser(walletAddress: string) {
  try {
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(sql`LOWER(${users.walletAddress}) = LOWER(${walletAddress})`)
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }

    const newUser = await db.insert(users).values({
      id: randomUUID(),
      walletAddress: walletAddress.toLowerCase(),
      createdAt: new Date(),
    }).returning({ id: users.id });

    return newUser[0];
  } catch (error) {
    console.error("Error in ensureUser:", error);
    throw error;
  }
}
