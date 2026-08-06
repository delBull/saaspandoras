import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './apps/dashboard/src/db/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function check() {
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, 17)
  });
  console.log('Project:', project ? project.slug : 'Not found');
  if (project) {
    console.log('w2eConfig:', JSON.stringify(project.w2eConfig, null, 2));
  }

  const installed = await db.query.installedProducts.findFirst({
    where: eq(schema.installedProducts.projectId, 17)
  });
  console.log('Installed:', installed ? installed.product : 'Not found');
  if (installed) {
    console.log('Capabilities:', installed.capabilities);
    console.log('Config:', JSON.stringify(installed.config, null, 2));
  }
}

check().catch(console.error);
