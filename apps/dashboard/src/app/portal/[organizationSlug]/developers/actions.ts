'use server';

import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { DeveloperDomainService } from '@/lib/platform/developers.service';

export async function generateKeyAction(organizationSlug: string, name: string, environment: 'production' | 'staging') {
  try {
    const portalCtx = await resolvePortalContext(organizationSlug);
    const service = new DeveloperDomainService(portalCtx.tenant);
    return await service.generateKey(name, environment);
  } catch (error: any) {
    console.error("Failed to generate key:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export async function revokeKeyAction(organizationSlug: string, keyId: string) {
  try {
    const portalCtx = await resolvePortalContext(organizationSlug);
    const service = new DeveloperDomainService(portalCtx.tenant);
    return await service.revokeKey(keyId);
  } catch (error: any) {
    console.error("Failed to revoke key:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
