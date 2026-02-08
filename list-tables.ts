
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: "./apps/dashboard/.env" });

dotenv.config({ path: "./apps/dashboard/.env.local" });

const connectionString = process.env.DATABASE_URL_MAIN;
if (!connectionString) throw new Error("DATABASE_URL_MAIN not found");

const sql = postgres(connectionString);

async function main() {
    console.log("--- Listing Tables in DB ---");
    try {
        const tables = await sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

        if (tables.length === 0) {
            console.log("⚠️ No tables found in 'public' schema!");
        } else {
            console.log("Found tables:");
            tables.forEach(t => console.log(`- ${t.table_schema}.${t.table_name}`));
        }

    } catch (e) {
        console.error("❌ Stats query failed:", e);
    }
}

main().catch(console.error).finally(() => process.exit());
