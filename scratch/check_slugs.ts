import { db } from "../apps/dashboard/src/db";
import { projects } from "../apps/dashboard/src/db/schema";

async function main() {
  const allProjects = await db.select().from(projects);
  console.log("Slugs:", allProjects.map(p => p.slug));
}

main().catch(console.error);
