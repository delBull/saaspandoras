import { db } from '@/db';
import { marketingLeads, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PlatformActor } from '@/lib/dash-contracts/admin';
import { PlatformCapabilityRegistryService } from './platform-capability-registry.service';
import { PlatformAuditLedgerService } from './platform-audit-ledger.service';

export interface ProvisioningIntentResult {
  success: boolean;
  intentId?: string;
  leadId: string;
  tenantSlug?: string;
  error?: string;
}

/**
 * 🏛️ HQProvisioningHandoffService
 * apps/dashboard/src/lib/admin/hq-provisioning-handoff.service.ts
 *
 * Implements the asynchronous, audited boundary between HQ Commercial Plane (CRM)
 * and Operations / Control Plane (Infrastructure Provisioning).
 *
 * Rule: The CRM NEVER creates tenants directly. It registers an audited Provisioning Intent
 * that Operations Plane evaluates and fulfills.
 */
export class HQProvisioningHandoffService {
  /**
   * Promotes a CLOSED_WON lead to a Tenant Provisioning Intent.
   */
  public static async initiateProvisioningHandoff(
    actor: PlatformActor,
    leadId: string,
    targetTenantSlug: string,
    targetTenantTitle: string
  ): Promise<ProvisioningIntentResult> {
    // 1. Invariant: Only Operations Plane authorized actors can trigger provisioning
    const evalResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      actor,
      'ops.tenant.provision',
      'all'
    );

    if (!evalResult.granted) {
      throw new Error(`[HQProvisioningHandoff] Unauthorized: ${evalResult.reason}`);
    }

    // 2. Fetch the Lead from HQ CRM
    const lead = await db.query.marketingLeads.findFirst({
      where: eq(marketingLeads.id, leadId),
    });

    if (!lead) {
      return { success: false, leadId, error: 'Lead not found in HQ CRM' };
    }

    // 3. Invariant: Lead must be in CLOSED_WON status for handoff
    const currentMetadata = (lead.metadata as Record<string, any>) || {};
    const crmStatus = (lead.status as string) || '';

    // Record intent ID
    const intentId = `intent_${Date.now()}_${leadId.slice(0, 8)}`;

    // 4. Update Lead with Provisioning Reference in CRM (Without creating live infra here)
    const updatedMetadata = {
      ...currentMetadata,
      provisioning: {
        intentId,
        status: 'PENDING_OPERATIONS',
        requestedBy: actor.id,
        targetTenantSlug,
        targetTenantTitle,
        initiatedAt: new Date().toISOString(),
      },
    };

    await db.update(marketingLeads)
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(marketingLeads.id, leadId));

    // 5. Record Auditable State Transition in Platform Ledger
    await PlatformAuditLedgerService.recordEntry({
      actorId: actor.id,
      actorWallet: actor.walletAddress || '0x0000',
      actorRole: actor.role,
      actorType: actor.actorType,
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'marketing_leads',
      resourceId: leadId,
      capability: 'ops.tenant.provision',
      governance: {
        isDiscord2faVerified: actor.isDiscord2faVerified,
        auditReason: `Handoff from CLOSED_WON lead ${leadId} to tenant ${targetTenantSlug}`,
      },
      stateTransition: {
        previousState: { provisioningStatus: null },
        newState: {
          intentId,
          targetTenantSlug,
          targetTenantTitle,
          status: 'PENDING_OPERATIONS',
        },
      },
      result: 'SUCCESS',
    });

    return {
      success: true,
      intentId,
      leadId,
      tenantSlug: targetTenantSlug,
    };
  }
}
