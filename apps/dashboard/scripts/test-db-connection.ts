import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { projects } from '../src/db/schema';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  try {
    const res = await db.select().from(projects).limit(1);
    console.log("DB connected successfully. Found project:", res[0]?.slug);
  } catch(e) {
    console.error("DB error:", e);
  }
}
run();
