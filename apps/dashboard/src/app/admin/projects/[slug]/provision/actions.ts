'use server';

import { getNexusAuthContext } from "@saasfly/shared";
import { TenantProvisioner, TenantIntelligenceProvisionInput } from "@saasfly/hermes-core";
import { headers } from "next/headers";

export async function provisionTenantAction(payload: TenantIntelligenceProvisionInput) {
  const reqHeaders = await headers();
  const auth = await getNexusAuthContext(reqHeaders);

  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
    return { success: false, error: 'Unauthorized: Requires SUPER_ADMIN or ADMIN role.' };
  }

  try {
    const result = await TenantProvisioner.provisionTenantIntelligence(payload);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('[ProvisionTenantAction] Error:', error);
    return { success: false, error: error.message || 'Error interno al aprovisionar el tenant.' };
  }
}
