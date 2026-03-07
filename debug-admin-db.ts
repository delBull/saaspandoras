
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./apps/dashboard/src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: "./apps/dashboard/.env.local" });

const connectionString = process.env.DATABASE_URL_STAGING;
if (!connectionString) throw new Error("DATABASE_URL_STAGING not found");

const client = postgres(connectionString);
const db = drizzle(client, { schema });
const administrators = schema.administrators;

async function main() {
    console.log("--- Debugging isAdmin DB Check ---");
    // Test with a random address that should NOT be admin
    const randomAddress = "0x9876543210987654321098765432109876543210";
    console.log(`Checking random address: ${randomAddress}`);

    try {
        const result = await db
            .select()
            .from(administrators)
            .where(eq(administrators.walletAddress, randomAddress));

        console.log(`Result length: ${result.length}`);
        console.log(`Is Admin? ${result.length > 0}`);

        if (result.length > 0) {
            console.log("❌ CRITICAL: Random address found as admin!");
        } else {
            console.log("✅ Correct: Random address is not admin.");
        }

        // List all admins
        console.log("\nList of all admins:");
        const allAdmins = await db.select().from(administrators);
        allAdmins.forEach(a => console.log(`- ${a.walletAddress} (${a.role})`));

    } catch (e) {
        console.error("❌ DB Query Failed:", e);
    }
}

main().catch(console.error).finally(() => process.exit());
