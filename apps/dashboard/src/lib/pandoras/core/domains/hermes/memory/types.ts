export interface SessionMemory {
  conversationId: string;
  turnCount: number;
  lastActive: Date;
  activeContext: Record<string, unknown>;
  temporaryVariables: Record<string, unknown>;
}

export interface TenantOperationalState {
  tenantId: string;
  productsEnabled: string[];
  setupCompletion: number;
  missingPrerequisites: string[];
  integrations: {
    service: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  }[];
  lastSync: Date;
}

export interface UserPreference {
  actorId: string;
  preferences: Record<string, unknown>;
  declaredObjectives: string[];
  lastUpdated: Date;
}
