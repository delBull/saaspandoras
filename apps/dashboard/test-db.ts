import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
    // 1. List all columns in projects table
    const cols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    ORDER BY ordinal_position
  `);
    console.log('\n=== projects table columns ===');
    for (const c of cols) {
        console.log(`  ${c.column_name} (${c.data_type})`);
    }

    // 2. Show the "escuela libre" project specifically
    const proj = await db.execute(sql`
    SELECT * FROM projects WHERE slug ILIKE '%escuela%' OR title ILIKE '%escuela%' LIMIT 1
  `);
    if (proj.length > 0) {
        console.log('\n=== Escuela Libre project raw data ===');
        console.log(JSON.stringify(proj[0], null, 2));
    } else {
        // Show all projects
        const all = await db.execute(sql`SELECT id, title, slug, status FROM projects ORDER BY created_at DESC LIMIT 10`);
        console.log('\n=== All projects (last 10) ===');
        console.table(all);
    }

    process.exit(0);
}
main().catch(console.error);
