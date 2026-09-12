/**
 * 🔄 Pandora's Platform OS — Organization Lifecycle Manager
 * lib/platform/lifecycle-manager.ts
 *
 * Manages commercial and operational status of organizations:
 * Trial -> Starter -> Growth -> Enterprise -> Suspended -> Churned.
 */

import { db } from '@/db';
import { installedProducts, projects } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { PlanKey } from './product-registry';
import { HermesTrialTimelineService } from '@/lib/hermes/trial/hermes-trial-timeline.service';

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
    // 1. Audit trials that have passed trialEndsAt date in installedProducts
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

    // 2. Audit and update projects table (tenantType === 'TRIAL' and trialEndsAt < now and trialStatus === 'ACTIVE')
    const expiredProjects = await db
      .select({ id: projects.id, slug: projects.slug })
      .from(projects)
      .where(
        and(
          eq(projects.tenantType, 'TRIAL'),
          eq(projects.trialStatus, 'ACTIVE'),
          sql`${projects.trialEndsAt} < ${now}`
        )
      );

    for (const p of expiredProjects) {
      await db
        .update(projects)
        .set({ trialStatus: 'EXPIRED', updatedAt: now })
        .where(eq(projects.id, p.id));

      await HermesTrialTimelineService.recordEvent(p.slug, 'TRIAL_EXPIRED', {
        metadata: { expiredAt: now.toISOString(), reason: '72h_duration_elapsed' },
      }).catch(() => {});
    }

    return {
      checked: trials.length,
      expiredCount: expired.length,
      expiredIds: expired,
      expiredProjectsCount: expiredProjects.length,
      expiredProjectSlugs: expiredProjects.map((p) => p.slug),
    };
  }
}
