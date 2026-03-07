import { db } from "./index";
import { sql } from "drizzle-orm";

async function diagnose() {
  console.log("🔍 Starting Database Diagnosis...");

  try {
    // 1. Check Tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("📋 Public Tables:", tables.map(t => t.table_name).join(", "));

    // 2. Check Enums
    const enums = await db.execute(sql`
      SELECT t.typname as enum_name,
             string_agg(e.enumlabel, ', ') as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      GROUP BY t.typname
    `);
    console.log("📋 Enums:", enums);

    // 3. Check specific table for the user's error
    const hasJobTable = (tables as any[]).some(t => t.table_name === 'deployment_jobs');
    console.log(`🚀 Table 'deployment_jobs' exists: ${hasJobTable}`);

    // 4. Check Connection Activity
    const activity = await db.execute(sql`
      SELECT datname, count(*) as conn_count
      FROM pg_stat_activity
      GROUP BY datname
    `);
    console.log("📊 Connection Activity:", activity);

  } catch (error) {
    console.error("💥 Diagnosis FAILED:", error);
  } finally {
    process.exit(0);
  }
}

diagnose();
