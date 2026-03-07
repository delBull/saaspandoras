import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log("Starting Gamification DB Fix...");
    const sql = neon(process.env.DATABASE_URL);

    try {
        // 1. Delete all duplicated achievements, keeping only the first one inserted
        console.log("Deduplicating achievements...");
        await sql`
      DELETE FROM achievements
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM achievements
        GROUP BY name
      );
    `;
        console.log("Achievements deduplicated.");

        // 2. Add 'code' column if it doesn't exist
        console.log("Adding 'code' column...");
        await sql`
      ALTER TABLE achievements 
      ADD COLUMN IF NOT EXISTS code VARCHAR(50);
    `;

        // 3. Assign codes to existing achievements based on their name
        console.log("Assigning codes...");
        await sql`
      UPDATE achievements 
      SET code = 'TG_' || UPPER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '_'), 'á', 'A'), 'é', 'E'), 'ó', 'O'))
      WHERE code IS NULL;
    `;

        // 4. Make code unique
        console.log("Adding unique constraint on 'code'...");
        await sql`
      ALTER TABLE achievements 
      ADD CONSTRAINT achievements_code_unique UNIQUE (code);
    `;
        console.log("Constraint added successfully.");

    } catch (error) {
        if (error.message.includes("already exists")) {
            console.log("Unique constraint already exists, continuing...");
        } else {
            console.error("Migration failed:", error);
        }
    }

    console.log("Gamification fix complete!");
}

main().catch(console.error);
