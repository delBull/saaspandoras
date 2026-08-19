const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_vlg6icORXA3k@ep-spring-mountain-awqc41zk-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function main() {
  await client.connect();
  const res = await client.query(`
    INSERT INTO projects (slug, title, chain_id, rpc_url, external_url) 
    VALUES ('hermes', 'Hermes AI', 11155111, 'https://rpc.sepolia.org', 'https://pandoras.finance/hermes')
    RETURNING id;
  `);
  console.log('Inserted project Hermes:', res.rows[0]);
  await client.end();
}
main();
