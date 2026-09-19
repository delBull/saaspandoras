import { db } from '@/db';
import { hermesSecurityEvents, hermesAddonAudit } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CanonicalAuthSession } from '@/lib/hermes/auth/canonical-resolver';

export interface ProjectedActivityEvent {
  id: string;
  domain: 'SECURITY' | 'CONFIGURATION' | 'HERMES' | 'GOVERNANCE';
  eventType: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  actorId: string | null;
  description: string;
  metadata?: any;
  createdAt: string;
}

export class HermesActivityService {
  /**
   * Projects raw DB events into a semantic Activity Feed scoped strictly to canonicalOrgId.
   */
  public static async getActivity(session: CanonicalAuthSession): Promise<{
    activities: ProjectedActivityEvent[],
    organizationName: string
  }> {
    const { canonicalOrgId, projectSlug } = session;

    // 1. Fetch Security Events
    const rawSecurityEvents = await db
      .select()
      .from(hermesSecurityEvents)
      .where(eq(hermesSecurityEvents.organizationId, canonicalOrgId))
      .orderBy(desc(hermesSecurityEvents.sequenceNumber), desc(hermesSecurityEvents.createdAt))
      .limit(100);

    // 2. Fetch Addon Audits
    const rawAddonAudits = await db
      .select()
      .from(hermesAddonAudit)
      .where(eq(hermesAddonAudit.organizationId, canonicalOrgId))
      .orderBy(desc(hermesAddonAudit.createdAt))
      .limit(50);

    const activities: ProjectedActivityEvent[] = [];

    for (const e of rawSecurityEvents) {
      // Determine semantic domain
      let domain: 'SECURITY' | 'CONFIGURATION' | 'HERMES' | 'GOVERNANCE' = 'SECURITY';
      if (e.eventType.includes('GOVERNANCE') || e.eventType.includes('CLAIM')) domain = 'GOVERNANCE';
      else if (e.eventType.includes('POLICY')) domain = 'HERMES';

      activities.push({
        id: e.id,
        domain,
        eventType: e.eventType,
        severity: (e.severity === 'CRITICAL' ? 'CRITICAL' : e.severity === 'WARN' ? 'WARN' : 'INFO'),
        actorId: e.actorId,
        description: `Security Event: ${e.eventType} - ${e.policyDecision}`,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString()
      });
    }

    for (const a of rawAddonAudits) {
      activities.push({
        id: a.id,
        domain: 'CONFIGURATION',
        eventType: a.eventType || 'ADDON_UPDATE',
        severity: 'INFO',
        actorId: a.actorId,
        description: `Addon ${a.addonId} transitioned from ${a.oldStatus} to ${a.newStatus}`,
        createdAt: a.createdAt.toISOString()
      });
    }

    // Sort combined feed by date descending
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { activities: activities.slice(0, 100), organizationName: projectSlug };
  }
}
