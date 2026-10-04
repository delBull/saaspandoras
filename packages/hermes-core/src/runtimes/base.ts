/**
 * Hermes OS - Runtime Kernel Interfaces
 * 
 * Defines the core abstractions for Hermes OS. 
 * Runtimes provide standard capabilities and enforce boundaries 
 * for Installed Packs, Connectors, and Engines.
 */

import { ContactContext } from './types';

// 1. Identity Runtime
// Resolves, merges, and tracks identities across channels.
export interface IIdentityRuntime {
  /**
   * Resolves an incoming identity to a MarketingLead.
   * If the identity doesn't exist, it creates an anonymous or scoped lead.
   */
  resolveIdentity(tenantId: number, identifier: { channel: string; externalId: string; email?: string }): Promise<{ leadId: string; isNew: boolean }>;
  
  /**
   * Merges a temporary/anonymous identity with an authenticated one.
   */
  mergeIdentities(sourceLeadId: string, targetLeadId: string): Promise<void>;
  
  /**
   * Updates tracking metrics (last action, engagement) for an identity.
   */
  recordEngagement(leadId: string, actionDetails: Record<string, any>): Promise<void>;
}

// 2. Entry Runtime
// Handles all entrypoints (Golden Links, SEO, Ads) and Context Resolution.
export interface IEntryRuntime {
  /**
   * Resolves a Golden Link slug to its parent Campaign and initializes a ContactContext.
   */
  resolveGoldenLink(slug: string): Promise<ContactContext>;

  /**
   * Validates if a lead is eligible to participate in a campaign based on scope/status.
   */
  validateEligibility(campaignId: number, leadId: string): Promise<{ eligible: boolean; reason?: string }>;
}

// 3. Conversation Runtime
// Manages ephemeral sessions, Contact Context, and persistence to DB/Redis.
export interface IConversationRuntime {
  /**
   * Initializes or resumes a session. Loads ContactContext into memory.
   */
  startSession(tenantId: number, leadId: string | undefined, contactContext: ContactContext, channel?: string): Promise<{ sessionId: string; context: ContactContext }>;
  
  /**
   * Updates in-memory session state.
   */
  updateContext(sessionId: string, patch: Partial<ContactContext>): Promise<void>;
  
  /**
   * Flushes in-memory context to persistent storage (marketing_leads.contact_context) and ends session.
   */
  endSession(sessionId: string): Promise<void>;
}

// 4. Journey Runtime
// Executes the logic defined by an Installed Pack.
export interface IJourneyRuntime {
  /**
   * Executes a specific step or node within a Journey.
   */
  executeStep(sessionId: string, packId: string, stepId: string, payload: any): Promise<{ nextStepId?: string; status: 'pending' | 'completed' | 'failed' }>;
  
  /**
   * Emits a standardized Hermes Event to the Event Store during a journey.
   */
  emitEvent(tenantId: number, sessionId: string, eventType: string, payload: Record<string, any>): Promise<void>;
}

// 5. Connector Runtime
// Abstract base for channels (Telegram, WhatsApp, Web Widget)
export abstract class ConnectorRuntime {
  protected channelName: string;

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  /**
   * Translates an incoming raw channel payload into a standardized Hermes Action.
   */
  abstract parseIncoming(rawPayload: any): Promise<{ leadIdentifier: string; action: string; data: any }>;
  
  /**
   * Formats a standardized Hermes Output into a channel-specific payload and dispatches it.
   */
  abstract dispatchOutgoing(destinationId: string, payload: any): Promise<void>;
}
