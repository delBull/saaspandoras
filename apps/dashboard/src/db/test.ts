import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon('postgresql://neondb_owner:npg_1fEihWlM6cvP@ep-wandering-cherry-a8d8shpd-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');
const db = drizzle(sql);

async function check() {
    const res = await sql`SELECT artifacts, raised_amount, id, title FROM projects WHERE id = 2`;
    console.log(JSON.stringify(res, null, 2));
}

check().catch(console.error);
