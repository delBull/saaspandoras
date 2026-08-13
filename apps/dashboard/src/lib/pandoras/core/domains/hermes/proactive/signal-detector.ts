import { ProactiveSignal, SignalRegistry } from './signal-registry';
import { db } from '@/db';
import { projects, portalOnboardingState } from '@/db/schema';
import { eq, and, ne, isNotNull } from 'drizzle-orm';

export class SignalDetector {
  /**
   * Scans the database for behavioral signals that could justify a proactive intervention.
   * Returns a list of detected signals.
   */
  static async detectAbandonedOnboarding(): Promise<ProactiveSignal[]> {
    const signals: ProactiveSignal[] = [];
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    try {
      // Find tenants in DRAFT status who haven't completed onboarding in 48 hours
      // This requires a join or querying portalOnboardingState directly
      const stalled = await db.query.portalOnboardingState.findMany({
        where: (onb, { and, lt, ne }) => 
          and(
            lt(onb.updatedAt, fortyEightHoursAgo),
            ne(onb.stage, 'COMPLETED')
          )
      });

      for (const onb of stalled) {
        if (!onb.tenantId) continue;
        
        // Find corresponding project slug
        const proj = await db.query.projects.findFirst({
          where: eq(projects.id, parseInt(onb.tenantId, 10))
        });
        
        if (proj && proj.slug) {
          signals.push({
            id: `sig_abnd_onb_${Date.now()}_${proj.slug}`,
            type: 'ABANDONED_ONBOARDING',
            actorId: 'tenant_admin', // simplified
            organizationId: proj.slug,
            detectedAt: new Date().toISOString(),
            evidence: {
              onboardingStartedAt: onb.createdAt?.toISOString(),
              currentStage: onb.stage
            }
          });
        }
      }
    } catch (e) {
      console.error('[SignalDetector] Failed to detect ABANDONED_ONBOARDING:', e);
    }
    return signals;
  }

  // Stubs for other detectors that would query users, purchases, and sessions
  static async detectHesitantBuyers(): Promise<ProactiveSignal[]> {
    return []; // TODO: query purchases where status = 'pending' AND createdAt < 12h ago
  }

  static async detectPortalGhosts(): Promise<ProactiveSignal[]> {
    return []; // TODO: query users where lastActivityAt < 14d ago
  }

  static async detectHighIntent(): Promise<ProactiveSignal[]> {
    return []; // TODO: query analytics sessions
  }

  /**
   * Main entry point for the Scheduler / Worker
   */
  static async runAllDetectors(): Promise<ProactiveSignal[]> {
    console.log('[SignalDetector] Running proactive signal detection sweep...');
    const allSignals: ProactiveSignal[] = [];
    
    allSignals.push(...await this.detectAbandonedOnboarding());
    allSignals.push(...await this.detectHesitantBuyers());
    allSignals.push(...await this.detectPortalGhosts());
    allSignals.push(...await this.detectHighIntent());

    console.log(`[SignalDetector] Sweep complete. Detected ${allSignals.length} actionable signals.`);
    return allSignals;
  }
}
