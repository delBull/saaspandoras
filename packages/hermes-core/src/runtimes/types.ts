/**
 * Hermes OS - Runtime Types
 * Defines the core structures passed across Runtimes.
 */

export interface RelationshipContext {
  type: 'family' | 'investor' | 'friend' | 'ambassador' | 'organic';
  trustLevel: 'high' | 'medium' | 'low';
  referredBy?: string; // IdentityHash or ID of the referrer
}

export interface ContactContext {
  tenantId: number;
  campaignId?: number;
  journeyId?: string; // e.g. 'referral_trust_v1'
  relationship?: RelationshipContext;
  
  // Top level entry tracking
  entrypoint: 'golden_link' | 'organic' | 'seo' | 'google_ads' | 'linkedin' | 'telegram' | 'qr';
  entryChannel: 'web' | 'telegram' | 'whatsapp' | 'voice' | 'api' | 'widget';
  sourceMedium?: string;
  locale?: string;
  
  // Behavior overrides
  personaOverride?: 'institutional_concierge' | 'sales_concierge' | 'advisor' | 'assistant';
  knowledgePackOverride?: string[];
  
  metadata?: Record<string, any>;
}
