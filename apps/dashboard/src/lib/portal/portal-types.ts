/**
 * Portal Context Types — Phase 6.1 & 6.2
 * 
 * Canonical types for the Customer Operating Console.
 * All portal server components and actions operate from PortalTenantContext.
 */

import type { PortalPermission, PortalRole } from './permissions';

/**
 * The authorized context for a portal session.
 * Resolved server-side BEFORE any data is rendered.
 * 
 * URL params are NOT authoritative — this context is.
 */
export interface PortalTenantContext {
  /** Authenticated actor — from portal session JWT */
  actorId: string;
  sessionId: string;

  /** Authorized organization — verified server-side */
  organizationId: string;
  organizationSlug: string;

  /** Role resolved from membership */
  role: PortalRole;

  /** Permissions derived from role */
  permissions: PortalPermission[];
}

/** Resolved organization metadata for display */
export interface PortalOrganization {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  projectId: number;
  activeProduct: string | null;
}

/** The full context passed to PortalShell */
export interface PortalContext {
  tenant: PortalTenantContext;
  organization: PortalOrganization;
}

/**
 * System status vocabulary.
 * Must be derived from real persisted/runtime signals.
 * Never invent status — prefer "UNKNOWN" over fake "OPERATIONAL".
 */
export type SystemStatus =
  | 'READY'
  | 'ACTIVE'
  | 'PROCESSING'
  | 'WARNING'
  | 'ERROR'
  | 'NOT_CONFIGURED'
  | 'OFFLINE'
  | 'OPERATIONAL'
  | 'DEGRADED'
  | 'UNKNOWN';

export interface HermesSystemStatus {
  identity: SystemStatus;
  knowledge: SystemStatus;
  channels: SystemStatus;
  journeys: SystemStatus;
  governance: SystemStatus;
  cognitive: SystemStatus;
  execution: SystemStatus;
}

export interface ActivityEventView {
  id: string;
  timestamp: string | Date;
  type: string;
  description: string;
  channel?: string;
  journey?: string;
  status?: string;
}

/** 
 * Presentation-safe view model for Phase 6.2 Overview 
 * The UI components only consume this contract, decoupling them from DB schema.
 */
export interface HermesOverviewView {
  organization: {
    id: string;
    name: string;
  };

  systemStatus: 'NOT_CONFIGURED' | 'READY' | 'ATTENTION_REQUIRED';
  journeyStatus: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'BLOCKED' | 'COMPLETED';

  system: HermesSystemStatus;

  strategicActivity: {
    active: boolean;
    title?: string;
    stage?: string;
    progress?: number;
  };

  metrics: {
    activeJourneys?: number;
    activeConversations?: number;
    pendingDecisions?: number;
    connectedChannels?: number;
  };

  activity: ActivityEventView[];
}


/** Error types for context resolution failures */
export type PortalContextError =
  | 'NO_SESSION'
  | 'INVALID_SESSION'
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_ACCESS_DENIED'
  | 'INVALID_MEMBERSHIP';

export class PortalAuthorizationError extends Error {
  constructor(
    public readonly code: PortalContextError,
    message: string
  ) {
    super(message);
    this.name = 'PortalAuthorizationError';
  }
}
