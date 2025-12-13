
import { db } from "../src/db";
import { projects } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function verify() {
    console.log("🔍 Verifying Project 1 (BlockBunny)...");

    // Assuming ID 1 based on previous run, or search by slug
    const results = await db.select().from(projects).where(eq(projects.id, 1));

    if (!results.length) {
        console.log("❌ Project ID 1 not found via ID.");
        return;
    }

    const p = results[0];

    if (!p) {
        console.log("❌ Project undefined.");
        return;
    }

    console.log("✅ Project Found:", p.title);
    console.log("   slug:", p.slug);
    // Type assertion or correct property access based on schema
    console.log("   treasuryAddress (Schema):", p.treasuryAddress);
    process.exit(0);
}

verify().catch(e => { console.error(e); process.exit(1); });
