import { db } from './src/db';
import { projects } from './src/db/schema';

async function main() {
    const allProjects = await db.select().from(projects);
    console.log(JSON.stringify(allProjects, null, 2));
}

main().catch(console.error);
