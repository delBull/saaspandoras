import { sql } from "./database";
import { randomUUID } from "crypto";

export async function ensureUser(walletAddress: string) {

  try {
    // First, try to find existing user
    const users = await sql`
      SELECT "id" FROM "users"
      WHERE LOWER("walletAddress") = LOWER(${walletAddress})
      LIMIT 1
    `;

    if (users.length > 0) {
      return users[0];
    }

    // If not found, create new user
    const newUsers = await sql`
      INSERT INTO "users" ("id", "walletAddress", "createdAt")
      VALUES (${randomUUID()}, LOWER(${walletAddress}), ${new Date().toISOString()})
      RETURNING "id"
    `;

    return newUsers[0];
  } catch (error) {
    console.error("Error in ensureUser:", error);
    throw error;
  }
}
