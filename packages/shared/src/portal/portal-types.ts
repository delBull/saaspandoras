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

  // Relation backward to project metadata
  projectId: number;
  
  // Active product resolution (used by modules)
  activeProduct: string | null;

  // Tenant state
  isSimulationMode?: boolean | null;
}

/** Trial State and Quota Metadata for Governed Trial Tenants */
export interface PortalTrialContext {
  isTrial: boolean;
  tier?: 'SOFTWARE_ONLY' | 'MEDIA_ENABLED' | 'FOUNDER';
  startedAt?: Date | null;
  endsAt?: Date | null;
  status?: 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'PRESERVED' | null;
  isExpired?: boolean;
}

/** The full context passed to PortalShell */
export interface PortalContext {
  tenant: PortalTenantContext;
  organization: PortalOrganization;
  trial?: PortalTrialContext;
}

/**
 * System status vocabulary.
 * Must be derived from real persisted/runtime signals.
 * Never invent status — prefer "UNKNOWN" over fake "OPERATIONAL".
 */


/** 
 * Presentation-safe view model for Phase 6.2 Overview 
 * The UI components only consume this contract, decoupling them from DB schema.
 */


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
export { type SystemStatus, type HermesSystemStatus, type ActivityEventView, type HermesOverviewView } from '../dash-contracts/overview';
