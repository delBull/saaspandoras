export type LeadState =
  | 'CURIOUS'      // New visitor, browsing
  | 'AWARE'        // Aware of the project, exploring value
  | 'ENGAGED'      // High activity, viewing pricing/docs
  | 'HOT'          // Critical intent, recurring visits, wallet connected
  | 'INVESTOR'     // Converted, capital deployed
  | 'EVANGELIST'   // Advocate, referral activity
  | 'DROPPED'      // Churned, inactive
  | 'ARCHIVED';    // Junk or blocked

export type EngagementLevel = 'low' | 'mid' | 'high' | 'critical';

export type GrowthChannel = 'email' | 'whatsapp' | 'push' | 'in_app' | 'sales_team';

export type GrowthEvent =
  | 'LEAD_CAPTURED'
  | 'EMAIL_OPENED'
  | 'CLICKED_PROJECT'
  | 'WALLET_CONNECTED'
  | 'VIEW_PRICING'
  | 'SELECT_TIER'
  | 'COURSE_STARTED'
  | 'COURSE_COMPLETED'
  | 'PURCHASED'
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
  | 'CLICKED_WHITEPAPER'
  | 'STARTED_KYC'
  | 'RETURN_SESSION'
  | 'TIME_ON_PAGE_>_60S'
  | 'SCROLL_DEPTH_80'
  | 'HEARTBEAT';

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
  | 'SALES_INTERVENTION'    // Phase 85: Deterministic Close
  | 'SEND_DYNAMIC_OFFER'    // Phase 85: Risk-Adjusted Yield
  | 'GENERATE_LEAD_BRIEF'
  | 'SEND_EDUCATIONAL_NURTURE'
  | 'SEND_SOW';

export interface GrowthEngineResult {
  nextState: LeadState;
  actions: GrowthActionType[];
  scoreChange?: number; // Automated scoring (+10, +50, etc)
  priority?: number; // Added for rule orchestration (0-100)
  delay?: number | null; 
  ruleId?: string; // For audit traceability
  ruleCondition?: string; // Human-readable reason
  offer?: {
    type: 'fixed_yield' | 'equity_upside' | 'access_pass';
    value: string;
    description: string;
  };
  scarcity?: {
    slotsRemaining: number;
    deadlineAt: number;
  };
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
  failedActions: Record<string, { error: string; at: number }>; // Error history
  lastHotBypass?: number;
  activeOffer?: GrowthEngineResult['offer'];
  scarcity?: GrowthEngineResult['scarcity'];
  executingActions?: Record<string, boolean>; // Action locking
}

export const ALLOWED_TRANSITIONS: Record<LeadState, LeadState[]> = {
  'CURIOUS': ['AWARE', 'ENGAGED', 'HOT', 'DROPPED'],
  'AWARE': ['ENGAGED', 'HOT', 'DROPPED'],
  'ENGAGED': ['HOT', 'INVESTOR', 'DROPPED'],
  'HOT': ['INVESTOR', 'DROPPED'],
  'INVESTOR': ['EVANGELIST', 'DROPPED'],
  'EVANGELIST': ['DROPPED'],
  'DROPPED': ['CURIOUS', 'AWARE'],
  'ARCHIVED': ['CURIOUS']
};

export interface BehavioralProfile {
  riskProfile: 'low' | 'medium' | 'high';
  investmentStyle: 'yield' | 'flip' | 'speculative';
  convictionScore: number; // 0-100
  tags?: string[];
}

export interface LeadContextPayload {
  id: string | number; // The unique ID of the lead (UUID or Serial)
  email: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  intent: string;
  projectId: number;
  scope?: 'b2b' | 'b2c';
  score?: number;
  intentScore?: number; // Behavioral Score (0-100)
  priorityScore?: number; // Institutional Score (intent * value * decay)
  engagementLevel?: EngagementLevel;
  lastAction?: string | null;
  profile?: BehavioralProfile;
  metadata?: any;
}

export type ExecuteGrowthActions = (
  actions: GrowthActionType[],
  context: { lead: LeadContextPayload, project: ProjectContextPayload },
  ruleInfo?: { ruleId: string; ruleCondition?: string; isStressTest?: boolean },
  scoreChange?: number,
  engineResult?: GrowthEngineResult
) => Promise<void>;

export interface ProjectContextPayload {
  id: number;
  slug: string;
  name: string;
  type?: string; 
  differentiator?: string;
  businessCategory?: string;
  discordWebhookUrl?: string | null;
}
