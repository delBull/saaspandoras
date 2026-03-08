import { Client } from 'pg';

const stagingUrl = "postgresql://neondb_owner:npg_IZJDPG21sLkC@ep-muddy-mud-ad6mipow-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
    const client = new Client({ connectionString: stagingUrl });
    try {
        await client.connect();
        console.log("Connected to Staging DB. Dropping deployment_jobs...");

        await client.query(`DROP TABLE IF EXISTS deployment_jobs CASCADE;`);

        console.log("Table dropped successfully.");
    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await client.end();
    }
}

run().catch(console.error);
