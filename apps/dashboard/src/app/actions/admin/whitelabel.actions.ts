'use server';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAuditLedgerService } from '@/lib/admin/platform-audit-ledger.service';
import { PlatformCapabilityRegistryService } from '@/lib/admin/platform-capability-registry.service';
import { PlatformActor } from '@/lib/dash-contracts/admin';

export interface WhitelabelConfig {
  domain: string;
  brandColor: string;
  logoUrl: string;
}

export async function updateTenantWhitelabelConfig(tenantSlug: string, config: WhitelabelConfig) {
  try {
    const auth = await getNexusAuthContext();

    const actor: PlatformActor = {
      id: auth.email || 'SYSTEM',
      role: (auth.role as any) === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'PLATFORM_ADMIN',
      actorType: 'MAGIC_LINK',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false // En F9.12 se debe integrar 2FA real o simular temporalmente
    };

    const evalResult = PlatformCapabilityRegistryService.evaluateAuthorization(actor, 'admin.whitelabel', 'all');
    if (!evalResult.granted) {
      throw new Error(`Unauthorized: ${evalResult.reason}`);
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, tenantSlug)
    });

    if (!project) throw new Error('Tenant not found');

    const currentConfig = (project.extraConfig as any) || {};
    const previousWhitelabel = currentConfig.whitelabel || null;
    currentConfig.whitelabel = config;

    await db.update(projects)
      .set({ extraConfig: currentConfig })
      .where(eq(projects.id, project.id));

    await PlatformAuditLedgerService.recordEntry({
      actorId: auth.email || 'SYSTEM',
      actorWallet: auth.wallet || '0x0000',
      actorRole: auth.role || 'SYSTEM',
      actorType: 'USER',
      action: 'TENANT_WHITELABEL_UPDATED',
      targetResource: 'projects',
      resourceId: String(project.id),
      capability: 'admin.whitelabel',
      governance: { isDiscord2faVerified: actor.isDiscord2faVerified, auditReason: 'Configuring whitelabel' },
      stateTransition: { previousState: { config: previousWhitelabel }, newState: { config } },
      result: 'SUCCESS'
    });

    return { success: true };
  } catch (err: any) {
    console.error('⚠️ [AdminWhitelabelAction] Error:', err);
    return { success: false, error: err.message };
  }
}

export async function getTenantWhitelabelConfig(tenantSlug: string): Promise<WhitelabelConfig | null> {
  const auth = await getNexusAuthContext();
  if (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, tenantSlug)
  });

  if (!project) return null;

  return (project.extraConfig as any)?.whitelabel || null;
}
