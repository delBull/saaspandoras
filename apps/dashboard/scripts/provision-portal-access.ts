/**
 * Alta de acceso al Hermes Portal para un tenant existente.
 *
 *   bun apps/dashboard/scripts/provision-portal-access.ts \
 *     --tenant forge --email ops@forge.example [--name "Forge"] [--dry-run]
 *
 * Qué hace (idempotente):
 *   1. `projects.applicantEmail = <email>` en el proyecto del tenant.
 *   2. Upsert en `users` (email único) para que el login por magic link lo reconozca.
 *   3. Garantiza `installedProducts` (HERMES) del proyecto.
 *
 * Qué NO hace:
 *   - No genera ni imprime tokens (el magic link se pide en /portal/login).
 *   - No crea contraseñas: el acceso es por enlace de un solo uso enviado por email.
 */
import { db } from '@saasfly/db';
import { installedProducts, projects, users } from '@saasfly/db/schema';
import { and, eq } from '@saasfly/db-core';
import crypto from 'crypto';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const tenantSlug = (arg('tenant') ?? '').toLowerCase().trim();
const email = (arg('email') ?? '').toLowerCase().trim();
const name = arg('name') ?? 'Forge';
const dryRun = process.argv.includes('--dry-run');

async function main() {
  if (!tenantSlug || !/^[a-z0-9-]+$/.test(tenantSlug)) {
    throw new Error('Falta --tenant <slug> (ej. forge).');
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('Falta --email <correo válido>.');
  }

  const [project] = await db
    .select({ id: projects.id, slug: projects.slug, title: projects.title, applicantEmail: projects.applicantEmail })
    .from(projects)
    .where(eq(projects.slug, tenantSlug))
    .limit(1);

  if (!project) throw new Error(`No existe un proyecto con slug '${tenantSlug}'.`);

  console.log(`Proyecto: ${project.id} (${project.slug}) — ${project.title}`);
  console.log(`applicantEmail actual: ${project.applicantEmail ?? '(vacío)'} → nuevo: ${email}`);

  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  console.log(`Usuario: ${existingUser ? `existe (${existingUser.id})` : 'se creará'}`);

  const [product] = await db
    .select({ id: installedProducts.id })
    .from(installedProducts)
    .where(and(eq(installedProducts.projectId, project.id), eq(installedProducts.product, 'HERMES')))
    .limit(1);
  console.log(`installedProducts HERMES: ${product ? `existe (${product.id})` : 'se creará'}`);

  if (dryRun) {
    console.log('\n[dry-run] Sin cambios.');
    return;
  }

  await db.update(projects).set({ applicantEmail: email }).where(eq(projects.id, project.id));

  if (!existingUser) {
    await db.insert(users).values({
      id: `usr_${crypto.randomUUID()}`,
      email,
      name,
      role: 'user',
      status: 'ACTIVE',
    });
  }

  if (!product) {
    await db.insert(installedProducts).values({
      projectId: project.id,
      product: 'HERMES',
      productFamily: 'GROWTH_OS',
      plan: 'trial',
      status: 'trial',
      config: { email, companyName: project.title },
      runtimeManifest: { context: { adminEmail: email } },
    });
  }

  console.log('\nListo. El usuario entra en /portal/login con su email y recibe el enlace.');
}

main().catch((error) => {
  console.error('[provision-portal-access]', error instanceof Error ? error.message : error);
  process.exit(1);
});
