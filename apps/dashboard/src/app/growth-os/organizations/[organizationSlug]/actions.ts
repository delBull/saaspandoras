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
  await DashApi.controlPlane.getOverview(requestedOrganizationId);
  return { missions: [] };
}

export async function getPendingIntents(requestedOrganizationId: string) {
  const pendingIntents = await DashApi.controlPlane.getPendingIntents(requestedOrganizationId);
  return { pendingIntents };
}

export async function getMissionAuditTrail(_requestedOrganizationId: string, _missionId?: string) {
  return await Promise.resolve({ auditTrail: [] });
}

// ============================================================================
// COMMANDS
// ============================================================================

export async function approveIntent(requestedOrganizationId: string, intentId: string, reason: string): Promise<CommandResult> {
  try {
    await DashApi.controlPlane.approveIntent(requestedOrganizationId, intentId, reason);
    
    try {
      revalidatePath(`/growth-os/organizations/${requestedOrganizationId}/governance`);
    } catch {
      // revalidatePath skipped in non-web contexts
    }
    
    return { success: true };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[ServerAction] approveIntent error:`, err);
    return { success: false, code: 'ERROR', message: err.message || 'Failed to approve intent' };
  }
}

export async function rejectIntent(requestedOrganizationId: string, intentId: string, reason: string): Promise<CommandResult> {
  try {
    await DashApi.controlPlane.rejectIntent(requestedOrganizationId, intentId, reason);
    
    try {
      revalidatePath(`/growth-os/organizations/${requestedOrganizationId}/governance`);
    } catch {
      // revalidatePath skipped in non-web contexts
    }
    
    return { success: true };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[ServerAction] rejectIntent error:`, err);
    return { success: false, code: 'ERROR', message: err.message || 'Failed to reject intent' };
  }
}

export async function createEmailCampaignAction(payload: {
  organizationSlug: string;
  name: string;
  templateId?: string;
  subject?: string;
  scheduledAt?: string;
}): Promise<CommandResult> {
  try {
    await DashApi.growth.createEmailCampaign({
      organizationId: `org_${payload.organizationSlug}`,
      name: payload.name,
      templateId: payload.templateId,
      subject: payload.subject,
      scheduledAt: payload.scheduledAt,
    });

    try {
      revalidatePath(`/growth-os/organizations/${payload.organizationSlug}/email`);
    } catch (e) {
      // revalidatePath skipped in non-web contexts
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[ServerAction] createEmailCampaignAction error:`, err);
    return { success: false, code: 'ERROR', message: err.message || 'Failed to create campaign' };
  }
}
