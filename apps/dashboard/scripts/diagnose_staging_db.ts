import { Client } from 'pg';

const stagingUrl = "postgresql://neondb_owner:npg_IZJDPG21sLkC@ep-muddy-mud-ad6mipow-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
    const client = new Client({ connectionString: stagingUrl });
    try {
        await client.connect();

        const result = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND column_name = 'id'
            ORDER BY table_name;
        `);

        console.table(result.rows);
    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await client.end();
    }
}

run().catch(console.error);
