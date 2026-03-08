import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Fetching columns for 'projects' table...");
        const result = await db.execute(sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'projects';
        `);
        console.log("Columns:", result.map((r: any) => r.column_name).join(', '));
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

run().catch(console.error);
