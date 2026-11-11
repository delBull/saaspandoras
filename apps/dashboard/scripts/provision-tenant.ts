/**
 * Aprovisiona un tenant de producción para Media Co (Content API) y emite su
 * API key S2S. Idempotente por slug: si el proyecto ya existe, aborta.
 *
 * Uso:
 *   DATABASE_URL=… bun apps/dashboard/scripts/provision-tenant.ts \
 *     --slug forge --title Forge --permit Media.Image,Media.Video,Media.Copy
 *
 * La key en claro se escribe en un archivo (600) y NUNCA se imprime en stdout.
 */
import crypto from 'crypto';
import fs from 'fs';
import { db } from '@saasfly/db';
import { integrationClients, hermesTenantCredits, projects } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { CapabilityGrantService } from '@saasfly/hermes-core';

const DEFAULT_PERMISSIONS = [
  'content.asset.read',
  'content.asset.create',
  'content.asset.approve',
  'media:generate',
  'hermes_a2a',
  'events:write',
];

function arg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  const value = idx !== -1 ? process.argv[idx + 1] : undefined;
  return value && value.length > 0 ? value : fallback;
}

async function main() {
  const slug = arg('slug', 'forge').toLowerCase();
  const title = arg('title', 'Forge');
  const description = arg('description', 'Tenant de producción — Media Co / Content API');
  const capabilities = arg('permit', 'Media.Image,Media.Video,Media.Copy')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const keyOut = arg('key-out', `/tmp/${slug}-integration-key.txt`);

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.');
  }

  const [existing] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug)).limit(1);
  if (existing) {
    throw new Error(`Tenant '${slug}' already exists (project id ${existing.id}). Aborting.`);
  }

  const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyFingerprint = `${rawKey.substring(0, 12)}...`;

  const result = await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        title,
        slug,
        description,
        status: 'live',
        isSimulationMode: false,
      })
      .returning({ id: projects.id, slug: projects.slug, organizationId: projects.organizationId });

    if (!project) throw new Error('Failed to create project.');

    const [client] = await tx
      .insert(integrationClients)
      .values({
        name: `${title} — S2S (Content API)`,
        environment: 'production',
        apiKeyHash,
        keyFingerprint,
        permissions: DEFAULT_PERMISSIONS,
        isActive: true,
        projectId: project.id,
      })
      .returning({ id: integrationClients.id });

    if (!client) throw new Error('Failed to create integration client.');

    await tx.insert(hermesTenantCredits).values({
      id: `cred_${crypto.randomUUID()}`,
      tenantId: slug,
      creditBalanceUsd: '0.0000',
      totalDepositedUsd: '0.0000',
      totalSpentUsd: '0.0000',
      markupPercentage: 35,
      isSandboxEnabled: true,
    });

    return { project, client };
  });

  // Los grants se persisten con el servicio canónico (misma ruta que usa la app).
  const granted: string[] = [];
  for (const capability of capabilities) {
    await CapabilityGrantService.setGrant(slug, capability, true, 'ops:provision-tenant');
    granted.push(capability);
  }

  fs.writeFileSync(keyOut, rawKey, { mode: 0o600 });

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenant: { slug: result.project.slug, projectId: result.project.id },
        integrationClientId: result.client.id,
        keyFingerprint,
        keyFile: keyOut,
        permissions: DEFAULT_PERMISSIONS,
        capabilities: granted,
        credits: { balanceUsd: 0, markupPercentage: 35 },
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[provision-tenant] failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
