/**
 * Hermes Universal Integration Contracts
 * ADR-011: Unified Execution Model
 */

export type ServiceStatus = 'healthy' | 'degraded' | 'maintenance' | 'offline';
export type WorkflowMode = 'immediate' | 'streaming' | 'async' | 'scheduled' | 'long_running';

/**
 * The official frozen capability namespaces for Hermes v1.
 */
export type CapabilityNamespace = 
  | 'identity'
  | 'knowledge'
  | 'language'
  | 'reasoning'
  | 'planning'
  | 'workflow'
  | 'artifact'
  | 'communication'
  | 'marketing'
  | 'content'
  | 'creative'
  | 'analytics'
  | 'sales'
  | 'commerce'
  | 'payment'
  | 'notification'
  | 'integration'
  | 'system';

export interface ServiceProvider {
  id: string;
  name: string;
  version: string;
  type: 'internal' | 'external' | 'platform';
  status: ServiceStatus;
  authentication?: any; 
  endpoint?: string;
  capabilities: string[]; // e.g. ['content.generate']
  metadata?: Record<string, any>;
}

export interface CapabilityDefinition {
  id: string;          // e.g. 'content.generate'
  namespace: CapabilityNamespace;
  name: string;
  description: string;
  supportedWorkflows: WorkflowMode[];
  estimatedCost?: number;
  averageTimeMs?: number;
}

export interface CapabilityBinding {
  capabilityId: string;    
  providerId: string;      
  tenantId?: string;       
  priority: number;        
  isActive: boolean;
}

export interface ExecutionCallback {
  url: string;
  secret: string;
  signature: string;
  retryPolicy: 'none' | 'linear' | 'exponential';
  expiresAt: Date;
}

/**
 * Universal Execution Envelope (ExecutionRequest)
 * Everything that occurs in Hermes receives exactly this envelope.
 * It is immutable and serializable for any transport layer.
 */
export interface ExecutionRequest {
  requestId: string;        // Unique identifier for this envelope across the mesh
  executionId: string;      // ID of the internal job/execution
  tenantId: string;
  organizationId?: string;
  channel: string;          // e.g. 'telegram', 'web-widget'
  identity: any;            // IdentityRuntime snapshot
  requester: string;
  executionProfile: 'interactive' | 'voice' | 'batch' | 'scheduled' | 'autonomous' | 'workflow' | 'human-handoff';
  conversation?: string;
  journey?: string;
  goal?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  deadline?: Date;
  timeoutMs?: number;
  capability: string;       // e.g. 'content.generate'
  payload: Record<string, any>; // Specific arguments for the capability
  metadata?: Record<string, any>;
  callback?: ExecutionCallback; // Async callback routing info
}

export interface ExecutionArtifact {
  id: string;
  type: string; 
  content: any;
  metadata?: Record<string, any>;
}

/**
 * Universal Execution Result
 * All providers MUST return this exact signature.
 */
export interface ExecutionResult {
  status: 'running' | 'completed' | 'failed';
  artifacts?: ExecutionArtifact[];
  telemetry?: Record<string, any>;
  cost?: number;
  warnings?: string[];
  events?: any[];
  metrics?: Record<string, any>;
}
