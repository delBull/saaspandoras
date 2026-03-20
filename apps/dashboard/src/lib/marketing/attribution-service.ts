import { db } from "@/db";
import { marketingLeads, projects, marketingLeadAttributions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export interface AttributionScore {
  score: number;
  factors: {
    domainMatch: boolean;
    fingerprintMatch: boolean;
    emailMatch: boolean;
  };
}

/**
 * Service to handle lead attribution and unification suggestions.
 * Follows the scoring logic:
 * - Domain Match: +0.5
 * - Fingerprint Match: +0.3
 * - Email Match: +0.2
 */
export class AttributionService {
  /**
   * Calculates the attribution score between a lead and a project.
   */
  static calculateScore(lead: any, project: any): AttributionScore {
    const factors = {
      domainMatch: false,
      fingerprintMatch: false,
      emailMatch: false,
    };

    // 1. Domain Match (+0.5)
    // Checks if lead.origin domain is in project.allowedDomains
    if (lead.origin && project.allowedDomains && Array.isArray(project.allowedDomains)) {
      try {
        const leadURL = new URL(lead.origin);
        const leadDomain = leadURL.hostname.replace('www.', '');
        
        factors.domainMatch = project.allowedDomains.some((d: string) => {
          const domain = d.replace('www.', '');
          return leadDomain === domain || leadDomain.endsWith('.' + domain);
        });
      } catch (e) {
        console.error('Error parsing lead origin URL:', lead.origin);
      }
    }

    // 2. Fingerprint Match (+0.3)
    // In a real scenario, we'd check if this fingerprint has converted in this project before
    // For suggestions, we might check if other leads with same fingerprint are in this project
    // (Wait, the user suggestion was simpler: just identifying signals)
    // Let's assume for now we look at the lead's own data.
    // Actually, fingerprint match only makes sense if we have other data points.
    // For now, let's stick to the principle: if we have a fingerprint match with existing project data.
    if (lead.fingerprint && project.metadata?.knownFingerprints?.includes(lead.fingerprint)) {
      factors.fingerprintMatch = true;
    }

    // 3. Email Match (+0.2)
    // If the email is already registered in this project (as a different lead record or user)
    // (This is rare for projectId=1 leads but possible if they used another account)
    if (lead.email && project.metadata?.knownEmails?.includes(lead.email)) {
      factors.emailMatch = true;
    }

    let score = 0;
    if (factors.domainMatch) score += 0.5;
    if (factors.fingerprintMatch) score += 0.3;
    if (factors.emailMatch) score += 0.2;

    return { score, factors };
  }

  /**
   * Scans for leads that should be attributed to a project.
   */
  static async getSuggestions(projectId: number) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    if (!project) throw new Error("Project not found");

    // Fetch leads from global pool (projectId = 1)
    const globalLeads = await db.query.marketingLeads.findMany({
      where: eq(marketingLeads.projectId, 1),
      limit: 100 // Safety limit
    });

    // Fetch existing attributions to avoid duplicates
    const existingAttributions = await db.query.marketingLeadAttributions.findMany({
      where: eq(marketingLeadAttributions.projectId, projectId)
    });
    const attributedLeadIds = new Set(existingAttributions.map(a => a.leadId));

    const suggestions = globalLeads
      .filter(lead => !attributedLeadIds.has(lead.id))
      .map(lead => ({
        lead,
        attribution: this.calculateScore(lead, project)
      }))
      .filter(s => s.attribution.score > 0)
      .sort((a, b) => b.attribution.score - a.attribution.score);

    return suggestions;
  }

  /**
   * Associates a lead with a project.
   */
  static async attributeLead(leadId: string, projectId: number, method: 'domain_match' | 'fingerprint_match' | 'email_match' | 'manual', score: number) {
    // 1. Create attribution record
    await db.insert(marketingLeadAttributions).values({
      leadId,
      projectId,
      attributionMethod: method,
      attributionType: 'shared',
      confidenceScore: score.toString(),
      metadata: { 
        timestamp: new Date().toISOString(),
        automatic: method !== 'manual'
      }
    });

    // 2. Emit event
    // We don't have a direct Event System helper yet, but we can insert into marketingLeadEvents
    const [event] = await db.execute(sql`
      INSERT INTO marketing_lead_events (lead_id, type, payload)
      VALUES (${leadId}, 'UNIFIED_TO_PROJECT', ${JSON.stringify({ projectId, method, score })})
      RETURNING id
    `);

    return event;
  }
}
