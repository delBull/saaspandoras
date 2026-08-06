import { db } from '@/db';
import { goldenLinks, campaigns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { IEntryRuntime } from './base';
import { ContactContext } from './types';

export class EntryRuntime implements IEntryRuntime {
  /**
   * Resolves a Golden Link slug to its parent Campaign and initializes a ContactContext.
   */
  async resolveGoldenLink(slug: string): Promise<ContactContext> {
    const [linkData] = await db
      .select({
        goldenLink: goldenLinks,
        campaign: campaigns,
      })
      .from(goldenLinks)
      .innerJoin(campaigns, eq(goldenLinks.campaignId, campaigns.id))
      .where(eq(goldenLinks.slug, slug))
      .limit(1);

    if (!linkData) {
      throw new Error(`Golden Link not found: ${slug}`);
    }

    if (!linkData.goldenLink.isActive) {
      throw new Error(`Golden Link is inactive: ${slug}`);
    }

    if (linkData.goldenLink.expiresAt && new Date() > new Date(linkData.goldenLink.expiresAt)) {
      throw new Error(`Golden Link has expired: ${slug}`);
    }

    // Map DB relationshipOverride to RelationshipContext type
    const relationshipType = (linkData.goldenLink.relationshipOverride as NonNullable<ContactContext['relationship']>['type']) || 'organic';
    
    // Default trust level based on relationship type
    let trustLevel: 'high' | 'medium' | 'low' = 'low';
    if (relationshipType === 'family' || relationshipType === 'investor' || relationshipType === 'ambassador') {
      trustLevel = 'high';
    } else if (relationshipType === 'friend') {
      trustLevel = 'medium';
    }

    return {
      tenantId: linkData.campaign.projectId,
      campaignId: linkData.campaign.id,
      relationship: {
        type: relationshipType,
        trustLevel,
        referredBy: linkData.goldenLink.referrerId || undefined,
      },
      entrypoint: 'golden_link',
      entryChannel: 'web', // By default, clicking a link opens the web browser
      locale: 'es', // Can be dynamically overridden later
      metadata: linkData.goldenLink.metadata as Record<string, any>,
    };
  }

  async validateEligibility(campaignId: number, leadId: string): Promise<{ eligible: boolean; reason?: string }> {
    // Basic stub. In a real scenario, checks if the lead is already enrolled, banned, or completed.
    return { eligible: true };
  }
}
