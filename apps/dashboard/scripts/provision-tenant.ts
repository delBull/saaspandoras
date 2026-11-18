/**
 * Aprovisiona un tenant de producción para Media Co (Content API) y emite su
 * API key S2S. Usa el MISMO servicio que el endpoint self-serve
 * (`lib/platform/tenant-provisioning`), para no duplicar lógica.
 *
 * Uso:
 *   DATABASE_URL=… bun apps/dashboard/scripts/provision-tenant.ts \
 *     --slug forge --title Forge --email mkt@forgeos.fitness \
 *     --permit Media.Image,Media.Video,Media.Copy
 *
 * La key en claro se escribe en un archivo (600) y NUNCA se imprime en stdout.
 */
import fs from 'fs';
import { provisionTenant, normalizeSlug, TenantProvisioningError } from '../src/lib/platform/tenant-provisioning';

function arg(name: string, fallback = ''): string {
  const idx = process.argv.indexOf(`--${name}`);
  const value = idx !== -1 ? process.argv[idx + 1] : undefined;
  return value && value.length > 0 ? value : fallback;
}

async function main() {
  const title = arg('title', 'Forge');
  const slug = normalizeSlug(arg('slug', title));
  const ownerEmail = arg('email', arg('owner-email', ''));
  const capabilities = arg('permit', 'Media.Image,Media.Video,Media.Copy')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const keyOut = arg('key-out', `/tmp/${slug}-integration-key.txt`);

  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  if (!ownerEmail) {
    throw new Error('Falta --email: sin email el tenant no puede entrar al Portal.');
  }

  const result = await provisionTenant({
    name: title,
    slug,
    ownerEmail,
    capabilities,
    actor: 'ops:provision-tenant',
  });

  fs.writeFileSync(keyOut, result.apiKey, { mode: 0o600 });

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenant: { slug: result.slug, projectId: result.projectId, ownerEmail: result.ownerEmail },
        keyFingerprint: result.keyFingerprint,
        keyFile: keyOut,
        permissions: result.permissions,
        capabilities: result.capabilities,
        credits: result.credits,
        portalUrl: result.portalUrl,
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    if (error instanceof TenantProvisioningError) {
      console.error(`[provision-tenant] ${error.code}: ${error.message}`);
    } else {
      console.error('[provision-tenant] failed:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  });
