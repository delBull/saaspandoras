import { postgres } from 'postgres';
import postgres_js from 'postgres';

const sql = postgres_js(process.env.DATABASE_URL_STAGING as string, { ssl: 'require' });

async function testStagingInsert() {
    try {
        console.log("Fetching test link...");
        const links = await sql`SELECT * FROM payment_links LIMIT 1`;
        if (links.length === 0) {
            console.log("No links found");
            process.exit(0);
        }
        
        const link = links[0];
        console.log(`Found link: ${link.id}, clientId: ${link.client_id}`);
        
        // Attempt insert
        const newId = crypto.randomUUID();
        const res = await sql`
            INSERT INTO transactions (id, link_id, client_id, amount, currency, method, status)
            VALUES (${newId}, ${link.id}, ${link.client_id}, ${link.amount}, 'USD', 'wire', 'completed')
            RETURNING *;
        `;
        console.log("Insert success:", res);
        
        // Cleanup
        await sql`DELETE FROM transactions WHERE id = ${newId}`;
        console.log("Cleanup success.");
        
    } catch (e) {
        console.error("Insert failed with error:");
        console.error(e);
    }
    process.exit(0);
}

testStagingInsert();
