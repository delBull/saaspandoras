import { config } from "dotenv";
config({ path: ".env.staging" });
import { db } from "@saasfly/db-core";
import { sql } from "@saasfly/db-core";

async function main() {
  try {
    const res = await db.execute(sql`SELECT * FROM project_events`);
    console.log("project_events count:", res.length);
  } catch (e: any) {
    console.error("Error project_events:");
    console.error(e);
  }
  
  try {
    const res = await db.execute(sql`SELECT * FROM platform_assets`);
    console.log("platform_assets count:", res.length);
  } catch (e: any) {
    console.error("Error platform_assets:");
    console.error(e);
  }
}
main();
