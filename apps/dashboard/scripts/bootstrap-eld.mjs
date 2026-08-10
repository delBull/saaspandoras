import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

// This script should be run in the apps/dashboard directory, or it will find .env from cwd
dotenv.config({ path: '.env.production' });

async function bootstrapEld() {
  console.log('Bootstrapping ELD Tenant in Production...');

  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = postgres(connectionString, { ssl: 'require', max: 1 });

  try {
    // Check if ELD exists
    const [existing] = await sql`SELECT id, slug FROM projects WHERE slug = 'eld' LIMIT 1;`;
    if (existing) {
      console.log(`✅ ELD Tenant already exists with ID: ${existing.id}`);
      return;
    }

    // Insert ELD Project
    const [newEld] = await sql`
      INSERT INTO projects (
        title, 
        slug, 
        description, 
        target_amount, 
        status
      ) VALUES (
        'Eco Land Development', 
        'eld', 
        'Eco Land Development (ELD) - Tenant Workspace', 
        0.00, 
        'draft'
      )
      RETURNING id, slug;
    `;

    console.log(`🎉 ELD Tenant bootstrapped successfully with ID: ${newEld.id}`);

    // Here we can also insert any necessary initial admin roles into dao_members if needed,
    // but the user specified: "pero no inyectemos nada, que esa sea la prueba real, que ellos lo hagan."
    // We only create the base tenant.

  } catch (error) {
    console.error('❌ Failed to bootstrap ELD:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

bootstrapEld();
