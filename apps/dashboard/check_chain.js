
import { Client } from 'pg';

async function checkChain() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_xvI24njyield@ep-spring-mountain-awqc41zk-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT id, title, slug, "chainId" FROM projects WHERE slug = 'snarai'`);
    console.log(res.rows);
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await client.end();
  }
}

checkChain();
