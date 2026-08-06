import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './apps/dashboard/src/db/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function check() {
  const installed = await db.query.installedProducts.findFirst({
    where: eq(schema.installedProducts.projectId, 17)
  });
  if (installed) {
    console.log('Pack ID:', installed.packId);
    console.log('Binding Mode:', installed.bindingMode);
    console.log('Runtime Manifest:', installed.runtimeManifest);
  } else {
    console.log("No installed product for ID 17");
  }
}

check().catch(console.error);
