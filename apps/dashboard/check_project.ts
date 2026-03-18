import { db } from './src/db';
import { projects } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const res = await db.query.projects.findFirst({
      where: eq(projects.slug, 'escuela-libre-digital-v2')
    });
    console.log('---PROJECT_DATA_START---');
    console.log(JSON.stringify(res, null, 2));
    console.log('---PROJECT_DATA_END---');
  } catch (err) {
    console.error(err);
  }
}

main().then(() => process.exit(0));
