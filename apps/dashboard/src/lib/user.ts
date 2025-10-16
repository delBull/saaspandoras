import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString);

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
      INSERT INTO "users" ("walletAddress", "createdAt")
      VALUES (LOWER(${walletAddress}), NOW())
      RETURNING "id"
    `;

    return newUsers[0];
  } catch (error) {
    console.error("Error in ensureUser:", error);
    throw error;
  }
}
