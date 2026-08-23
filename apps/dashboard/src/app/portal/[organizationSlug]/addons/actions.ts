'use server';

import { db } from '@/db';
import { hermesAddonInstallations, hermesAddonAudit } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { activateTenantAddOn, ensureCanonicalAddOnsRegistered } from '@/lib/pandoras/core/domains/hermes/addons/catalog';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function toggleAddOnAction(organizationSlug: string, addonId: string, targetActive: boolean) {
  const ctx = await resolvePortalContext(organizationSlug);
  const orgId = ctx.tenant.organizationId;
  const tenantSlug = ctx.tenant.organizationSlug || ctx.organization.slug || organizationSlug;

  await ensureCanonicalAddOnsRegistered();

  if (targetActive) {
    // Activate for slug and UUID
    await activateTenantAddOn(tenantSlug, addonId, {
      installedBy: ctx.tenant.actorId || 'tenant_owner',
      configuration: { enabled: true, activatedAt: new Date().toISOString() },
    });

    if (orgId && orgId !== tenantSlug) {
      await activateTenantAddOn(orgId, addonId, {
        installedBy: ctx.tenant.actorId || 'tenant_owner',
        configuration: { enabled: true, activatedAt: new Date().toISOString() },
      });
    }
  } else {
    // Deactivate
    const now = new Date();
    await db
      .update(hermesAddonInstallations)
      .set({
        status: 'DEACTIVATED',
        updatedAt: now,
      })
      .where(
        and(
          or(
            eq(hermesAddonInstallations.organizationId, tenantSlug),
            eq(hermesAddonInstallations.organizationId, orgId),
            eq(hermesAddonInstallations.organizationId, organizationSlug)
          ),
          eq(hermesAddonInstallations.addonId, addonId)
        )
      );

    await db.insert(hermesAddonAudit).values({
      id: `evt_${uuidv4()}`,
      organizationId: orgId,
      addonId,
      installationId: `inst_${addonId}_deact`,
      eventType: 'DEACTIVATED',
      actorId: ctx.tenant.actorId || 'tenant_owner',
      actorType: 'USER',
      oldStatus: 'ACTIVE',
      newStatus: 'DEACTIVATED',
      version: '1.0.0',
      reason: 'Deactivated by tenant owner from portal UI',
      createdAt: now,
    });
  }

  revalidatePath(`/portal/${organizationSlug}/addons`);
  return { success: true, active: targetActive };
}
