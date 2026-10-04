export type CapabilityState = 
  | 'AVAILABLE'
  | 'ENABLED'
  | 'AUTHORIZED'
  | 'REQUIRES_SETUP'
  | 'UNAVAILABLE';

export interface CapabilityResolution {
  capabilityId: string;
  state: CapabilityState;
  grantedBy: string; // e.g. "role:OWNER", "subscription:PREMIUM"
  restrictions?: string[];
}

export interface CapabilityEnvelope {
  actorId: string;
  tenantId: string;
  resolvedCapabilities: CapabilityResolution[];
  resolvedAt: Date;
}
