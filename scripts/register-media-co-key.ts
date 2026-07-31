import crypto from 'crypto';
import postgres from 'postgres';

/**
 * Script standalone en JS/TS puro para registrar/actualizar la API Key en NeonDB (Staging / Production)
 * Uso: bun run scripts/register-media-co-key.ts [staging|production]
 */
async function main() {
  const env = (process.argv[2] as 'staging' | 'production') || 'staging';
  console.log(`🚀 Generando API Key para Pandora's Media Co / Sofía AI (${env})...`);

  // 1. Generar Key pública
  const typePrefix = 'pk';
  const envPrefix = env === 'production' ? 'live' : 'test';
  const prefix = `${typePrefix}_${envPrefix}_`;
  const randomPart = crypto.randomBytes(24).toString('hex');
  const key = `${prefix}${randomPart}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const fingerprint = key;

  const clientName = "Pandora's Media Co / Sofía AI Engine";
  const scopes = JSON.stringify(['read:projects', 'read:users', 'read:governance', 'read:purchases', 'write:leads']);

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  // 2. Conectar a PostgreSQL con Pooler (prepare: false para Neon)
  const sql = postgres(dbUrl, { prepare: false, ssl: { rejectUnauthorized: false } });

  try {
    const existing = await sql`
      SELECT id FROM integration_clients WHERE name = ${clientName} LIMIT 1
    `;

    if (existing.length > 0) {
      console.log(`🔄 Actualizando cliente existente ID: ${existing[0].id}`);
      await sql`
        UPDATE integration_clients
        SET api_key_hash = ${hash},
            key_fingerprint = ${fingerprint},
            permissions = ${scopes}::jsonb,
            is_active = true,
            updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      console.log(`✨ Creando nuevo cliente en integration_clients: ${clientName}`);
      await sql`
        INSERT INTO integration_clients (name, environment, project_id, api_key_hash, key_fingerprint, permissions, is_active)
        VALUES (${clientName}, ${env}, 2, ${hash}, ${fingerprint}, ${scopes}::jsonb, true)
      `;
    }

    console.log("\n=======================================================");
    console.log("🔑 PANDORA'S MEDIA CO / SOFÍA AI API KEY GENERADA:");
    console.log(`x-api-key: ${key}`);
    console.log(`Environment: ${env}`);
    console.log(`Scopes Habilitados: ['read:projects', 'read:users', 'read:governance', 'read:purchases', 'write:leads']`);
    console.log("=======================================================\n");

  } finally {
    await sql.end();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error ejecutando script:", err);
  process.exit(1);
});
