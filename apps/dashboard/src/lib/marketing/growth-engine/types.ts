export type LeadState =
  | 'NEW'
  | 'EXPLORE'
  | 'EDUCATING'
  | 'ENGAGED'
  | 'INVEST_READY'
  | 'SCHEDULED'
  | 'CONVERTED'
  | 'ARCHIVED'
  | 'NURTURING';

export type GrowthEvent =
  | 'LEAD_CAPTURED'
  | 'EMAIL_OPENED'
  | 'COURSE_STARTED'
  | 'COURSE_COMPLETED'
  | 'CLICKED_PROJECT'
  | 'WALLET_CONNECTED'
  | 'VIEW_PRICING'
  | 'SELECT_TIER'
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_NO_SHOW'
  | 'CALL_COMPLETED'
  | 'SOW_EXPIRED'
  | 'EMAIL_BOUNCED'
  | 'WAITLIST_JOIN'
  | 'WAITLIST_FAST_TRACK'
  | 'USER_CLASSIFIED_GENESIS'
  | 'USER_CLASSIFIED_STANDARD'
  | 'ACCESS_ACTIVATION_COMPLETED'
  | 'HEARTBEAT'
  | 'PURCHASED';

export type GrowthActionType = 
  | 'SEND_WELCOME_EXPLORE_D1'
  | 'SEND_WELCOME_INVEST_D1'
  | 'SEND_WELCOME_B2B_D1'
  | 'SEND_FOLLOWUP_B2B_D2'
  | 'SEND_CALL_REMINDER_D3'
  | 'SEND_CALL_REMINDER_D1'
  | 'SEND_CALL_REMINDER_D0'
  | 'SEND_WAITLIST_WELCOME_D0'
  | 'SEND_WAITLIST_NARRATIVE_D1'
  | 'SEND_WAITLIST_STATUS_D2'
  | 'SEND_WAITLIST_ACTIVATION_D3'
  | 'SEND_GENESIS_WELCOME'
  | 'ASSIGN_COURSE'
  | 'NOTIFY_TEAM'
  | 'UNLOCK_REWARD'
  | 'SEND_OFFER'
  | 'SEND_BOOKING_CONFIRMED'
  | 'SEND_NO_SHOW_RECOVERY'
  | 'GENERATE_LEAD_BRIEF'
  | 'SEND_SOW';

export interface GrowthEngineResult {
  nextState: LeadState;
  actions: GrowthActionType[];
  scoreChange?: number; // Automated scoring (+10, +50, etc)
  priority?: number; // Added for rule orchestration (0-100)
  delay?: number | null; 
  ruleId?: string; // For audit traceability
  ruleCondition?: string; // Human-readable reason
}

export interface GrowthHistoryEntry {
  state: LeadState;
  at: number; // timestamp
}

export interface GrowthMetadata {
  state: LeadState;
  updatedAt: number;
  history: GrowthHistoryEntry[];
  executedActions: Record<string, boolean | number>; // Stores boolean or timestamp
  failedActions?: Record<string, { error: string; at: number }>; // Error history
  executingActions?: Record<string, boolean>; // Action locking
}

export const ALLOWED_TRANSITIONS: Record<LeadState, LeadState[]> = {
  'NEW': ['EXPLORE', 'INVEST_READY', 'CONVERTED'],
  'EXPLORE': ['EDUCATING', 'INVEST_READY', 'CONVERTED'],
  'EDUCATING': ['ENGAGED', 'INVEST_READY', 'CONVERTED'],
  'ENGAGED': ['INVEST_READY', 'SCHEDULED', 'CONVERTED'],
  'INVEST_READY': ['SCHEDULED', 'CONVERTED'],
  'SCHEDULED': ['INVEST_READY', 'CONVERTED', 'ARCHIVED', 'NURTURING'],
  'CONVERTED': [],
  'ARCHIVED': ['NURTURING', 'SCHEDULED'],
  'NURTURING': ['SCHEDULED', 'CONVERTED', 'ARCHIVED']
};

export interface LeadContextPayload {
  id: string; // The UUID of the lead
  email: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  intent: string;
  projectId: number;
  scope?: 'b2b' | 'b2c';
  score?: number;
  lastAction?: string | null;
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
