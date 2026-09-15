import { NexusAuthContext } from '@/lib/nexus/nexus-rbac';

export type OperationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type OperationType = 'DECISION' | 'TASK' | 'ALERT' | 'INTERVENTION';
export type OperationDomain = 'TREASURY' | 'GROWTH' | 'HERMES' | 'GOVERNANCE';
export type OperationVisibility = 'ASSIGNED' | 'TEAM' | 'ORG';

export interface NexusOperation {
  id: string;
  type: OperationType;
  priority: OperationPriority;
  domain: OperationDomain;
  title: string;
  description?: string;
  status: string;
  requiredCapability: string;
  assigneeId?: number | null;
  visibility: OperationVisibility;
  createdAt: Date;
  expiresAt?: Date | null;
  actions: {
    label: string;
    action: string;
    intent: 'primary' | 'secondary' | 'danger';
  }[];
  payload?: any;
}

export interface DomainAdapter {
  getOperations(authCtx: NexusAuthContext): Promise<NexusOperation[]>;
}
