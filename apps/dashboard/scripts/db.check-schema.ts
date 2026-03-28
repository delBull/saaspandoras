import { db } from "../src/db";
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

    const sessionColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sessions'
    `);
    console.log("📋 Columns in 'sessions' table:");
    console.log(JSON.stringify(sessionColumns, null, 2));

    const adminColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'administrators'
    `);
    console.log("📋 Columns in 'administrators' table:");
    console.log(JSON.stringify(adminColumns, null, 2));

    const projectColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects'
    `);
    console.log("📋 Columns in 'projects' table:");
    console.log(JSON.stringify(projectColumns, null, 2));

  } catch (error) {
    console.error("❌ Schema check FAILED:", error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
