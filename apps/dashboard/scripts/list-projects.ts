import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const projs = await db.select({ slug: schema.projects.slug, title: schema.projects.title }).from(schema.projects);
  console.log("Projects:", projs);
}

main().catch(console.error);
