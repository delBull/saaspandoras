export type LeadState =
  | 'NEW'
  | 'EXPLORE'
  | 'EDUCATING'
  | 'ENGAGED'
  | 'INVEST_READY'
  | 'CONVERTED';

export type GrowthEvent =
  | 'LEAD_CAPTURED'
  | 'EMAIL_OPENED'
  | 'COURSE_STARTED'
  | 'COURSE_COMPLETED'
  | 'CLICKED_PROJECT'
  | 'WALLET_CONNECTED'
  | 'PURCHASED';

export type GrowthActionType = 
  | 'SEND_WELCOME_EXPLORE_D1'
  | 'SEND_WELCOME_INVEST_D1'
  | 'ASSIGN_COURSE'
  | 'NOTIFY_TEAM'
  | 'UNLOCK_REWARD'
  | 'SEND_OFFER';

export interface GrowthEngineResult {
  nextState: LeadState;
  actions: GrowthActionType[];
  delay?: number | null; // e.g. delay until executing
}

export interface GrowthHistoryEntry {
  state: LeadState;
  at: number; // timestamp
}

export interface GrowthMetadata {
  state: LeadState;
  updatedAt: number;
  history: GrowthHistoryEntry[];
  executedActions: Record<string, boolean>; // O(1) map for scalability
  failedActions?: Record<string, { error: string; at: number }>; // Error history
  executingActions?: Record<string, boolean>; // Action locking
}

export const ALLOWED_TRANSITIONS: Record<LeadState, LeadState[]> = {
  'NEW': ['EXPLORE', 'INVEST_READY', 'CONVERTED'],
  'EXPLORE': ['EDUCATING', 'INVEST_READY', 'CONVERTED'],
  'EDUCATING': ['ENGAGED', 'INVEST_READY', 'CONVERTED'],
  'ENGAGED': ['INVEST_READY', 'CONVERTED'],
  'INVEST_READY': ['CONVERTED'],
  'CONVERTED': [] // Terminal state
};

export interface LeadContextPayload {
  id: string; // The UUID of the lead
  email: string;
  name?: string | null;
  intent: string;
  projectId: number;
  score?: number;
  metadata?: any;
}

export interface ProjectContextPayload {
  id: number;
  slug: string;
  name: string;
  type?: string; 
  differentiator?: string;
  businessCategory?: string;
  discordWebhookUrl?: string | null;
}
