export type KnowledgeDimension = 
  | 'identity'
  | 'business'
  | 'brand'
  | 'agent_soul'
  | 'projects'
  | 'products'
  | 'market'
  | 'operations'
  | 'governance'
  | 'public';

export type KnowledgeStatus = 
  | 'DISCOVERED'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'ACTIVE'
  | 'SUPERSEDED';

export type KnowledgeVisibility = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'PRIVATE';
export type KnowledgeAuthority = 'CANONICAL' | 'TENANT_PROVIDED' | 'DISCOVERED' | 'SYSTEM';
export type KnowledgeSource = 'ONBOARDING_CONVERSATION' | 'OWNER_INPUT' | 'ADMIN_INPUT' | 'DOCUMENT' | 'IMPORTED' | 'SYSTEM';

export interface KnowledgeContent {
  key: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeScope {
  organizationId: string;
  dimension: KnowledgeDimension;
}

export interface KnowledgeGovernance {
  visibility: KnowledgeVisibility;
  authority: KnowledgeAuthority;
  source: KnowledgeSource;
  sourceReference?: string; // e.g. documentId, conversationId
}

export interface KnowledgeLifecycle {
  status: KnowledgeStatus;
  version: number;
  supersedesId?: string;
  createdAt: Date;
  updatedAt: Date;
  effectiveAt?: Date;
}

export interface KnowledgeAudit {
  discoveredBy?: string; // actorId
  reviewedBy?: string;   // actorId
  rejectionReason?: string;
}

export interface GovernedKnowledgeItem {
  id: string;
  scope: KnowledgeScope;
  content: KnowledgeContent;
  governance: KnowledgeGovernance;
  lifecycle: KnowledgeLifecycle;
  audit: KnowledgeAudit;
}

// -------------------------------------
// Governance Commands Context & Roles
// -------------------------------------
export type ControlPlaneRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'SYSTEM';

export interface ControlPlaneContext {
  actorId: string;
  organizationId: string;
  role: ControlPlaneRole;
  permissions: string[];
  sessionId?: string;
}

// -------------------------------------
// Audit Trail Event Model
// -------------------------------------
export type AuditEventAction = 
  | 'CREATE'
  | 'DISCOVER'
  | 'SUBMIT_FOR_REVIEW'
  | 'APPROVE'
  | 'REJECT'
  | 'SUPERSEDE'
  | 'VISIBILITY_CHANGE'
  | 'AUTHORITY_CHANGE';

export interface KnowledgeMutationEvent {
  eventId: string;
  organizationId: string;
  knowledgeId: string;
  version: number;
  action: AuditEventAction;
  actorId: string;
  actorType: 'USER' | 'SYSTEM' | 'AGENT';
  timestamp: Date;
  previousStatus?: KnowledgeStatus;
  newStatus: KnowledgeStatus;
  reason?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}
