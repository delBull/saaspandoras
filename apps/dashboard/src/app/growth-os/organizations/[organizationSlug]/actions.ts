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
    } catch (_e) {
      // revalidatePath skipped in non-web contexts
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[ServerAction] createEmailCampaignAction error:`, err);
    return { success: false, code: 'ERROR', message: err.message || 'Failed to create campaign' };
  }
}

export async function createMarketAttackDraftAction(payload: {
  organizationSlug: string;
  name: string;
  hook: string;
  script: string;
  cta: string;
  platform?: string;
  angle?: string;
  emotion?: string;
  mechanism?: string;
}): Promise<CommandResult> {
  try {
    const { tryResolvePortalContext } = await import('@/lib/portal/resolve-portal-context');
    const { CampaignDomainService } = await import('@/lib/marketing/campaigns.service');

    const portalCtx = await tryResolvePortalContext(payload.organizationSlug);
    if (!portalCtx) {
      return { success: false, code: 'NOT_FOUND', message: 'Contexto de organización no encontrado' };
    }

    const service = new CampaignDomainService(portalCtx.tenant);
    const draftRes = await service.createDemandDraft({
      hook: payload.hook,
      script: payload.script,
      cta: payload.cta,
      angle: payload.angle,
      emotion: payload.emotion,
      mechanism: payload.mechanism,
    });

    if (draftRes.success && draftRes.draft?.id) {
      await service.launchCampaign({
        draftId: draftRes.draft.id,
        name: payload.name,
        platform: payload.platform || 'multi',
      });
    }

    try {
      revalidatePath(`/growth-os/organizations/${payload.organizationSlug}/growth/market-attack`);
    } catch (_e) {
      // revalidatePath skipped in non-web contexts
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[ServerAction] createMarketAttackDraftAction error:`, err);
    return { success: false, code: 'ERROR', message: err.message || 'Error al desplegar draft de demanda' };
  }
}
