import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function checkSchema() {
  console.log("🔍 Checking 'users' table columns...");
  try {
    const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log("📋 Columns in 'users' table:");
    console.log(JSON.stringify(columns, null, 2));

    const gamificationColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gamification_profiles'
    `);
    console.log("📋 Columns in 'gamification_profiles' table:");
    console.log(JSON.stringify(gamificationColumns, null, 2));

  } catch (error) {
    console.error("❌ Schema check FAILED:", error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
