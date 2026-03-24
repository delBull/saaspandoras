import { db } from './src/db';
import { projects } from './src/db/schema';
import { ilike, or } from 'drizzle-orm';

async function main() {
    const results = await db.select().from(projects).where(
        or(
            ilike(projects.title, '%narai%'),
            ilike(projects.slug, '%narai%')
        )
    );
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
