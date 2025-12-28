
import { db } from "./src/db";
import { projects } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🔍 Checking Projects in DB...");
    const all = await db.select().from(projects);
    console.log(`✅ Total Projects: ${all.length}`);

    const live = all.filter(p => p.status === 'live');
    console.log(`🟢 Live Projects: ${live.length}`);

    const featured = all.filter(p => p.featured === true);
    console.log(`🌟 Featured Projects: ${featured.length}`);

    const liveAndFeatured = live.filter(p => p.featured === true);
    console.log(`🟢🌟 Live & Featured: ${liveAndFeatured.length}`);

    all.forEach(p => {
        console.log(`- [${p.id}] ${p.title} | Status: ${p.status} | Featured: ${p.featured}`);
    });

    process.exit(0);
}

main().catch(console.error);
