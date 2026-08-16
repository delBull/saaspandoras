import { db } from './apps/dashboard/src/db';
import { projects, users } from './apps/dashboard/src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const p = await db.select().from(projects).where(eq(projects.slug, 'snarai'));
    console.log(p);
}
main();
