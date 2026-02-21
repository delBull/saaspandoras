import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function fixDatabase() {
    console.log("🛠️ Starting database fix script...");

    try {
        // 1. Add missing columns to projects table
        console.log("📝 Adding missing columns to 'projects' table...");

        await db.execute(sql`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS protocol_version INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS registry_contract_address VARCHAR(42),
      ADD COLUMN IF NOT EXISTS artifacts JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS page_layout_type VARCHAR(50);
    `);

        console.log("✅ Database columns updated successfully.");

        // 2. Identify projects that should be V2
        // If a project has artifacts in w2e_config but protocol_version is 1, set it to 2
        console.log("🔄 Updating protocol versions for V2 projects...");
        await db.execute(sql`
      UPDATE projects 
      SET protocol_version = 2 
      WHERE protocol_version = 1 
      AND (
        (w2e_config->'artifacts') IS NOT NULL 
        AND jsonb_array_length(w2e_config->'artifacts') > 0
      );
    `);

        console.log("✅ Protocol versions updated.");

    } catch (error) {
        console.error("❌ Error fixing database:", error);
    } finally {
        process.exit(0);
    }
}

fixDatabase();
