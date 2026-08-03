/**
 * 🔄 Pandora's Platform OS — Organization Lifecycle Manager
 * lib/platform/lifecycle-manager.ts
 *
 * Manages commercial and operational status of organizations:
 * Trial -> Starter -> Growth -> Enterprise -> Suspended -> Churned.
 */

import { db } from '@/db';
import { installedProducts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PlanKey } from './product-registry';

export class OrganizationLifecycleManager {
  static async updateStatus(opts: {
    installedProductId: string;
    status: 'trial' | 'active' | 'suspended' | 'churned';
    newPlan?: PlanKey;
  }) {
    const { installedProductId, status, newPlan } = opts;

    console.info(`[LifecycleManager] Updating product ${installedProductId} to status=${status}, plan=${newPlan}`);

    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (newPlan) {
      updateData.plan = newPlan;
    }

    if (status === 'active') {
      updateData.activatedAt = new Date();
    }

    await db.update(installedProducts)
      .set(updateData)
      .where(eq(installedProducts.id, installedProductId));

    return { success: true, installedProductId, status, newPlan };
  }

  static async checkTrialExpirations() {
    // Audit trials that have passed trialEndsAt date
    const trials = await db.query.installedProducts.findMany({
      where: eq(installedProducts.status, 'trial'),
    });

    const now = new Date();
    const expired: string[] = [];

    for (const t of trials) {
      if (t.trialEndsAt && t.trialEndsAt < now) {
        await this.updateStatus({ installedProductId: t.id, status: 'suspended' });
        expired.push(t.id);
      }
    }

    return { checked: trials.length, expiredCount: expired.length, expiredIds: expired };
  }
}
