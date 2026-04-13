import { db } from './src/db/index.js';
import { projects } from './src/db/schema.js';
import { ilike } from 'drizzle-orm';

async function findNarai() {
  try {
    const results = await db.select().from(projects).where(ilike(projects.slug, '%narai%'));
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

findNarai();
