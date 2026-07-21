const { Pool } = require('@neondatabase/serverless');

async function migrate() {
  const client = new Pool({
    connectionString: "postgresql://neondb_owner:npg_xvI24njyield@ep-spring-mountain-awqc41zk-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log("Connected to Neon DB.");
    
    const alterQuery = `
      ALTER TABLE project_briefings
      ADD COLUMN IF NOT EXISTS title_en VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
      ADD COLUMN IF NOT EXISTS blocks_en JSONB DEFAULT '[]'::jsonb;
    `;
    
    await client.query(alterQuery);
    console.log("Migration successful.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
