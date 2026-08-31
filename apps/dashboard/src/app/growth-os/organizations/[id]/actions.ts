'use server';

import { revalidatePath } from 'next/cache';
import { DashApi } from '@/lib/dash-api';

export type CommandResult = 
  | { success: true }
  | { success: false; code: string; message: string };

export async function getOrganizationOverview(requestedOrganizationId: string) {
  return await DashApi.controlPlane.getOverview(requestedOrganizationId);
}

export async function getActiveMissions(requestedOrganizationId: string) {
  const data = await DashApi.controlPlane.getOverview(requestedOrganizationId);
  return { missions: [] };
}

export async function getPendingIntents(requestedOrganizationId: string) {
  const pendingIntents = await DashApi.controlPlane.getPendingIntents(requestedOrganizationId);
  return { pendingIntents };
}

export async function getMissionAuditTrail(requestedOrganizationId: string, missionId?: string) {
  return { auditTrail: [] };
}

// ============================================================================
// COMMANDS
// ============================================================================

export async function approveIntent(requestedOrganizationId: string, intentId: string, reason: string): Promise<CommandResult> {
  try {
    await DashApi.controlPlane.approveIntent(requestedOrganizationId, intentId, reason);
    
    try {
      revalidatePath(`/growth-os/organizations/${requestedOrganizationId}/governance`);
    } catch (e) {
      // revalidatePath skipped in non-web contexts
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`[ServerAction] approveIntent error:`, error);
    return { success: false, code: 'ERROR', message: error.message || 'Failed to approve intent' };
  }
}

export async function rejectIntent(requestedOrganizationId: string, intentId: string, reason: string): Promise<CommandResult> {
  try {
    await DashApi.controlPlane.rejectIntent(requestedOrganizationId, intentId, reason);
    
    try {
      revalidatePath(`/growth-os/organizations/${requestedOrganizationId}/governance`);
    } catch (e) {
      // revalidatePath skipped in non-web contexts
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`[ServerAction] rejectIntent error:`, error);
    return { success: false, code: 'ERROR', message: error.message || 'Failed to reject intent' };
  }
}
