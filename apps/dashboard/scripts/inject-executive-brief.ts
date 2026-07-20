import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

// Use provided production DB
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_xvI24njyield@ep-spring-mountain-awqc41zk-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});
const db = drizzle(pool, { schema });

async function injectDocument() {
  console.log("Starting injection into production DB...");
  
  // S'Narai is usually slug: snarai
  const snarai = await db.select().from(schema.projects).where(eq(schema.projects.slug, 'snarai')).limit(1);
  if (!snarai || snarai.length === 0) {
    console.error("Project snarai not found.");
    process.exit(1);
  }
  
  const project = snarai[0];
  const projectId = project.id;
  const extraConfig = project.extraConfig || {};
  
  if (!extraConfig.resourceHub) {
    extraConfig.resourceHub = {};
  }
  if (!extraConfig.resourceHub.documents) {
    extraConfig.resourceHub.documents = [];
  }

  // Check if it already exists
  const exists = extraConfig.resourceHub.documents.find((d: any) => d.title === "Executive Investment Brief");
  
  if (!exists) {
    extraConfig.resourceHub.documents.push({
      url: "https://snarai.aztecaz.xyz/en/institutional/executive-investment-brief",
      desc: "An Executive Overview for Prospective Investors",
      title: "Executive Investment Brief"
    });

    console.log("Adding Executive Investment Brief to extraConfig...");
    
    await db.update(schema.projects)
      .set({ extraConfig })
      .where(eq(schema.projects.id, projectId));
      
    console.log("Successfully updated projects table with new document in extraConfig.");
  } else {
    console.log("Executive Investment Brief already exists in extraConfig.");
  }

  console.log("Document injected successfully into Pandoras OS (Production).");
  process.exit(0);
}

injectDocument().catch(e => {
  console.error(e);
  process.exit(1);
});
