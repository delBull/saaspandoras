import { db } from "../apps/dashboard/src/db";
import { projects, marketingLeads } from "../apps/dashboard/src/db/schema";
import { eq, sql } from "drizzle-orm";

async function checkLeads() {
    console.log("--- Projects Check ---");
    const allProjects = await db.select({ id: projects.id, title: projects.title, slug: projects.slug }).from(projects);
    console.table(allProjects);

    const snarais = allProjects.filter(p => p.slug === 'snarai' || p.title.toLowerCase().includes('narai'));
    if (snarais.length === 0) {
        console.log("No S'Narai project found!");
        process.exit(0);
    }

    for (const p of snarais) {
        console.log(`\n--- Leads for ${p.title} (ID: ${p.id}) ---`);
        const count = await db.select({ count: sql<number>`count(*)` }).from(marketingLeads).where(eq(marketingLeads.projectId, p.id));
        console.log(`Total Leads: ${count[0].count}`);

        const sample = await db.select().from(marketingLeads).where(eq(marketingLeads.projectId, p.id)).limit(5);
        console.log("Sample Leads:", JSON.stringify(sample, null, 2));
    }
    
    process.exit(0);
}

checkLeads().catch(err => {
    console.error(err);
    process.exit(1);
});
