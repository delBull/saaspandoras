import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
  console.log('[migrate] Creating hermes_addons, hermes_addon_installations, hermes_addon_audit tables...');
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS hermes_addons (
        id VARCHAR(256) PRIMARY KEY,
        name VARCHAR(256) NOT NULL,
        version VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        manifest JSONB NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('  ✅ hermes_addons created');

    await sql`
      CREATE TABLE IF NOT EXISTS hermes_addon_installations (
        id VARCHAR(256) PRIMARY KEY,
        organization_id VARCHAR(256) NOT NULL,
        addon_id VARCHAR(256) NOT NULL REFERENCES hermes_addons(id),
        version VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        configuration JSONB NOT NULL DEFAULT '{}',
        manifest_snapshot JSONB,
        installed_by VARCHAR(256) NOT NULL,
        approved_by VARCHAR(256),
        installed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        activated_at TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('  ✅ hermes_addon_installations created');

    await sql`
      CREATE INDEX IF NOT EXISTS hermes_addon_install_tenant_idx ON hermes_addon_installations(organization_id)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS hermes_addon_audit (
        id VARCHAR(256) PRIMARY KEY,
        organization_id VARCHAR(256) NOT NULL,
        addon_id VARCHAR(256) NOT NULL,
        installation_id VARCHAR(256) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        actor_id VARCHAR(256) NOT NULL,
        actor_type VARCHAR(50) NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        version VARCHAR(50) NOT NULL,
        reason TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('  ✅ hermes_addon_audit created');

    // Seed catalog with test add-ons
    await sql`
      INSERT INTO hermes_addons (id, name, version, type, description, manifest)
      VALUES
        ('core.customer_support', 'Customer Support', '1.0.0', 'CAPABILITY', 'Customer support capabilities', 
         '{"id":"core.customer_support","name":"Customer Support","version":"1.0.0","capabilities":[{"id":"core.customer_support.chat","name":"Live Chat","description":"Enables live chat"}],"governanceRequirements":{"requiresHumanApproval":true}}'::jsonb),
        ('core.sales_agent', 'Sales Agent', '1.0.0', 'CAPABILITY', 'Sales automation capabilities',
         '{"id":"core.sales_agent","name":"Sales Agent","version":"1.0.0","capabilities":[{"id":"core.sales_agent.qualify","name":"Lead Qualification","description":"Qualifies leads"}],"governanceRequirements":{"requiresHumanApproval":true}}'::jsonb)
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('  ✅ Catalog seeded (core.customer_support, core.sales_agent)');

    console.log('\n[migrate] Done! Tables are ready.');
  } catch (err: any) {
    console.error('[migrate] Error:', err.message);
  } finally {
    await sql.end();
  }
}

migrate();
