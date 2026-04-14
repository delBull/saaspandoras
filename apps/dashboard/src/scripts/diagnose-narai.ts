
import { db } from "../db";
import { projects, purchases, daoMembers } from "../db/schema";
import { eq, and } from "drizzle-orm";

async function diagnose() {
    const slug = "narai";
    console.log(`Diagnosing project: ${slug}`);

    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, slug)
    });

    if (!project) {
        console.error("Project not found");
        return;
    }

    console.log("--- Project Data ---");
    console.log(JSON.stringify(project, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

    const membersCount = await db.select().from(daoMembers).where(eq(daoMembers.projectId, project.id));
    console.log(`\n--- DAO Members (${membersCount.length}) ---`);

    const purchaseStats = await db.select().from(purchases).where(and(eq(purchases.projectId, project.id), eq(purchases.status, 'completed')));
    console.log(`\n--- Completed Purchases (${purchaseStats.length}) ---`);
}

diagnose().catch(console.error);
