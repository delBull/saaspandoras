import { BaseVerticalPaymentAdapter } from './base-adapter';
import { PaymentSettlementEvent, PaymentVertical } from '../core/types';
import { db } from "@saasfly/db-core";
import { installedProducts, projects, platformEvents, users } from "@saasfly/db-core";
import { sendTenantProvisionEmail } from '@saasfly/shared';
import { eq, and } from "@saasfly/db-core";
import { PlatformAuditLedgerService } from '../../admin/platform-audit-ledger.service';

/**
 * 📈 Growth OS Adapter
 * Translates a normalized PaymentSettlementEvent into an entitlement (installed_products) mutation.
 */
export class GrowthPaymentAdapter extends BaseVerticalPaymentAdapter {
  readonly vertical: PaymentVertical = 'GROWTH_OS';

  async handleSettlement(event: PaymentSettlementEvent): Promise<void> {
    console.log(`[GrowthPaymentAdapter] Received settlement for ${event.organizationId} / Product: ${event.productId}`);
    
    // 1. Resolve Project ID from canonical Organization ID
    const [project] = await db.select({ id: projects.id, title: projects.title, applicantWalletAddress: projects.applicantWalletAddress })
      .from(projects)
      .where(eq(projects.organizationId, event.organizationId))
      .limit(1);

    if (!project) {
      throw new Error(`[GrowthPaymentAdapter] Project not found for orgId: ${event.organizationId}`);
    }

    // Map vertical to productFamily
    const productFamily = event.vertical === 'HERMES_OS' ? 'HERMES' : 'GROWTH_OS';

    // Ensure atomicity and concurrency-safe idempotency via transaction
    const settled = await db.transaction(async (tx) => {
      // 2. Perform the domain-specific mutation (Upgrade Plan)
      // We check if it exists first
      const [existing] = await tx.select()
        .from(installedProducts)
        .where(
          and(
            eq(installedProducts.projectId, project.id),
            eq(installedProducts.productFamily, productFamily)
          )
        )
        .limit(1);

      if (existing) {
        if (existing.plan === event.productId && existing.status === 'active') {
           // Already settled
           return false;
        }
        await tx.update(installedProducts)
          .set({ 
            plan: event.productId as any,
            status: 'active' 
          })
          .where(eq(installedProducts.id, existing.id));
      } else {
        await tx.insert(installedProducts)
          .values({
            projectId: project.id,
            product: event.productId as any,
            productFamily: productFamily,
            plan: event.productId as any,
            status: 'active',
            bindingMode: 'provisioned'
          });
      }

      // 3. Emit the domain event to the Event Spine atomically
      await tx.insert(platformEvents).values({
        eventId: `evt_growth_settled_${event.intentId}`,
        eventType: 'growth.subscription.settled',
        identityId: 'system',
        correlationId: event.intentId,
        sourceSystem: 'PaymentCore.GrowthAdapter',
        organizationId: event.organizationId,
        projectId: String(project.id),
        occurredAt: new Date(),
        payload: {
          productId: event.productId,
          productFamily,
          amount: event.amount,
          currency: event.currency,
          provider: event.provider,
          providerTransactionId: event.providerTransactionId,
        }
      });

      return true;
    });

    if (!settled) {
      console.log(`[GrowthPaymentAdapter] Settlement ${event.intentId} is already completed or concurrently modified. Idempotent skip.`);
      return;
    }

    // 4. Register Domain Audit
    PlatformAuditLedgerService.recordEntry({
      actorId: 'hermes_payment_core',
      actorWallet: 'system',
      actorRole: 'SUPER_ADMIN',
      actorType: 'SYSTEM',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'project',
      resourceId: event.organizationId,
      capability: 'growth.billing.settlement',
      governance: {
        isDiscord2faVerified: false,
        auditReason: `Automated payment settled via ${event.provider} (Tx: ${event.providerTransactionId})`,
      },
      stateTransition: {
        previousState: null,
        newState: { plan: event.productId, status: 'active' },
      },
      result: 'SUCCESS',
    });

    // 5. Send Email Notification
    if (project.applicantWalletAddress) {
      const [owner] = await db.select({ email: users.email })
        .from(users)
        .where(eq(users.walletAddress, project.applicantWalletAddress))
        .limit(1);
      
      if (owner && owner.email) {
        await sendTenantProvisionEmail(owner.email, project.title, event.productId);
      }
    }

    console.log(`[GrowthPaymentAdapter] Successfully upgraded tenant ${event.organizationId} to ${event.productId}`);
  }
}
