
import { db } from "./apps/dashboard/src/db";
import { projects } from "./apps/dashboard/src/db/schema";
import { eq } from "drizzle-orm";

async function inspect() {
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, 'snarai')
    });
    console.log(JSON.stringify(project, null, 2));
}

inspect().catch(console.error);
