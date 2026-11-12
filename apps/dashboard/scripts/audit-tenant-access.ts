/**
 * Auditoría de acceso al Portal.
 *
 * Detecta tenants que, por su estado en la DB, NO podrán entrar al portal
 * aunque su magic link sea válido. Es el chequeo que faltaba cuando Forge
 * recibió "Acceso Denegado":
 *
 *   1. `tenant_type = PRODUCTION` + producto en `trial`
 *      → el portal aplica el boundary "trial no accede a producción".
 *   2. Tenant vivo SIN `applicantEmail` → no puede recibir magic link.
 *   3. Tenant vivo SIN producto instalado → el hub queda vacío.
 *
 * Uso:
 *   DATABASE_URL=… bun apps/dashboard/scripts/audit-tenant-access.ts
 *
 * Sale con código 1 si encuentra algún problema (útil en CI/ops).
 */
import { db } from '@saasfly/db';
import { installedProducts, projects } from '@saasfly/db/schema';

const LIVE_STATUSES = ['live', 'active_client', 'approved', 'production'];

async function main() {
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      status: projects.status,
      tenantType: projects.tenantType,
      applicantEmail: projects.applicantEmail,
    })
    .from(projects);

  const products = await db
    .select({
      projectId: installedProducts.projectId,
      product: installedProducts.product,
      plan: installedProducts.plan,
      status: installedProducts.status,
    })
    .from(installedProducts);

  const byProject = new Map<number, typeof products>();
  for (const p of products) {
    const list = byProject.get(p.projectId) ?? [];
    list.push(p);
    byProject.set(p.projectId, list);
  }

  const problems: Array<{ slug: string; id: number; issue: string; detail: string }> = [];

  for (const project of rows) {
    const isLive = LIVE_STATUSES.includes(String(project.status));
    const installed = byProject.get(project.id) ?? [];

    if (!isLive) continue;

    if (!project.applicantEmail) {
      problems.push({
        slug: project.slug,
        id: project.id,
        issue: 'NO_OWNER_EMAIL',
        detail: 'Tenant vivo sin applicantEmail: no puede recibir magic link.',
      });
    }

    if (installed.length === 0) {
      problems.push({
        slug: project.slug,
        id: project.id,
        issue: 'NO_PRODUCT',
        detail: 'Tenant vivo sin productos instalados: el hub queda vacío.',
      });
      continue;
    }

    if (project.tenantType === 'PRODUCTION') {
      for (const p of installed) {
        if (p.status === 'trial' || p.plan === 'trial') {
          problems.push({
            slug: project.slug,
            id: project.id,
            issue: 'TRIAL_PRODUCT_ON_PRODUCTION',
            detail: `${p.product}: plan=${p.plan} status=${p.status} → el portal rechazará la sesión.`,
          });
        }
      }
    }
  }

  if (problems.length === 0) {
    console.log(`✅ Sin bloqueos detectados (${rows.length} proyectos revisados).`);
    return;
  }

  console.log(`⚠️  ${problems.length} problema(s) de acceso:`);
  for (const p of problems) {
    console.log(`  · [${p.issue}] ${p.slug} (#${p.id}) — ${p.detail}`);
  }
  process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error: unknown) => {
    console.error('[audit-tenant-access] failed:', error instanceof Error ? error.message : error);
    process.exit(2);
  });
