/**
 * 📦 Dash Contracts — Hermes Overview DTOs
 * src/lib/dash-contracts/overview.ts
 */



export interface GetOverviewResponseDTO {
  overview: HermesOverviewView;
  organizationName: string;
}

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
