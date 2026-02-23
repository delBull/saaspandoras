import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from 'drizzle-orm';
import * as schema from "../src/db/schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    console.log("Starting Gamification DB Fix...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is missing");
    }

    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient);

    try {
        console.log("1. Deduplicating achievements...");
        await migrationClient`
            DELETE FROM achievements
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM achievements
                GROUP BY name
            );
        `;
        console.log("   Deduplication completed.");

        console.log("2. Adding 'code' column if missing...");
        await migrationClient`
            ALTER TABLE achievements ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        `;
        console.log("   Column added.");

        console.log("3. Assigning codes to existing achievements...");
        await migrationClient`
            UPDATE achievements 
            SET code = 'TG_' || UPPER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '_'), 'á', 'A'), 'é', 'E'), 'ó', 'O'))
            WHERE code IS NULL;
        `;
        console.log("   Codes assigned.");

        console.log("4. Adding UNIQUE constraint to 'code'...");
        await migrationClient`
            ALTER TABLE achievements ADD CONSTRAINT achievements_code_unique UNIQUE (code);
        `;
        console.log("   Unique constraint added.");

    } catch (err) {
        if (err.message?.includes("already exists")) {
            console.log("Constraint already exists, skipping...");
        } else {
            console.error("Migration failed:", err);
        }
    } finally {
        await migrationClient.end();
        console.log("Database connection closed.");
    }
}

main().catch(console.error);
