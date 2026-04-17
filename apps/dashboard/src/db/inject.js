import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon('postgresql://neondb_owner:npg_1fEihWlM6cvP@ep-wandering-cherry-a8d8shpd-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');
const db = drizzle(sql);

async function check() {
    console.log("Checking DB...");
    const rows = await sql`SELECT artifacts FROM projects WHERE id = 2`;
    let artifacts = rows[0]?.artifacts;
    if (typeof artifacts === 'string') {
        artifacts = JSON.parse(artifacts);
    }
    console.log("Current artifacts:", JSON.stringify(artifacts, null, 2));

    if (Array.isArray(artifacts)) {
        artifacts = artifacts.map(a => {
            if (a.name === 'Fundador') return { ...a, consumptionsUsed: 4 };
            if (a.name === 'Estratégico') return { ...a, consumptionsUsed: 0 };
            if (a.name === 'Geeral') return { ...a, consumptionsUsed: 0 };
            return a;
        });
        
        await sql`UPDATE projects SET artifacts = ${JSON.stringify(artifacts)}::jsonb WHERE id = 2`;
        console.log("Successfully injected explicit consumptionsUsed for V2 synchronization!");
    }
}

check().catch(console.error);
