import { 
  LeadState, 
  GrowthEvent, 
  GrowthEngineResult, 
  LeadContextPayload, 
  ALLOWED_TRANSITIONS, 
  GrowthActionType, 
  ProjectContextPayload,
  EngagementLevel,
  BehavioralProfile
} from './types';

/**
 * 🧠 INSTITUTIONAL BEHAVIORAL CORE (Phase 80)
 * Calculates intent, priority, and behavioral profiling.
 */
export function computeBehavioralMetrics(
  lead: LeadContextPayload, 
  events: any[] = []
): { 
  intentScore: number; 
  priorityScore: number;
  engagementLevel: EngagementLevel;
  profile: BehavioralProfile;
} {
  let intentScore = 0;
  
  // 1. Institutional Event Weights
  const eventWeights: Record<string, number> = {
    'EMAIL_OPENED': 2,
    'CLICKED_PROJECT': 10,
    'WALLET_CONNECTED': 40, // High conviction
    'VIEW_PRICING': 25,     // Strong intent
    'SELECT_TIER': 30,
    'CLICKED_WHITEPAPER': 15,
    'STARTED_KYC': 50,      // Near conversion
    'RETURN_SESSION': 20,   // Retention/Interest
    'TIME_ON_PAGE_>_60S': 10,
    'SCROLL_DEPTH_80': 15
  };

  events.forEach(e => {
    intentScore += eventWeights[e.type] || 0;
  });

  // 2. Intent-based baseline
  const intentBaselines: Record<string, number> = {
    'invest': 30,
    'whitelist': 20,
    'explore': 5
  };
  intentScore += intentBaselines[lead.intent.toLowerCase()] || 0;
  intentScore = Math.min(100, intentScore);

  // 3. Institutional Priority Score (intent * value * decay)
  // priorityScore = intentScore * (walletValue / 1000) * decay
  const capitalRaw = lead.metadata?.capital || 0;
  const capital = typeof capitalRaw === 'string' ? 
    parseInt(capitalRaw.replace(/[^0-9]/g, '')) || 0 : 
    Number(capitalRaw);
  
  const valueMultiplier = capital >= 100000 ? 2.0 : (capital >= 25000 ? 1.5 : 1.0);
  
  const lastUpdate = (lead as any).updatedAt ? new Date((lead as any).updatedAt).getTime() : Date.now();
  const daysIdle = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
  const timeDecay = Math.max(0.2, 1 - (daysIdle * 0.05)); // -5% per day idle

  const priorityScore = Math.floor(intentScore * valueMultiplier * timeDecay);

  // 4. Resolve Engagement Level
  let engagementLevel: EngagementLevel = 'low';
  if (intentScore >= 90 || priorityScore >= 150) engagementLevel = 'critical';
  else if (intentScore >= 70 || priorityScore >= 100) engagementLevel = 'high';
  else if (intentScore >= 40) engagementLevel = 'mid';

  // 5. Behavioral Profiling (Psychological Overlay)
  const profile: BehavioralProfile = {
    riskProfile: capital >= 50000 ? 'medium' : 'low',
    investmentStyle: events.some(e => e.type === 'CLICKED_WHITEPAPER') ? 'yield' : 'speculative',
    convictionScore: intentScore,
    tags: [] // Initialize tags as an empty array
  };

  // Add tags based on events
  if (events.some(e => e.type === 'WALLET_CONNECTED')) profile.tags?.push('crypto_savvy');
  if (events.some(e => e.type === 'VIEW_PRICING' || e.type === 'SELECT_TIER')) profile.tags?.push('price_sensitive');
  if (events.some(e => e.type === 'STARTED_KYC')) profile.tags?.push('high_intent_action');

  return { intentScore, priorityScore, engagementLevel, profile };
}

/**
 * Phase 85: The Offer Engine
 * Resolves the most persuasive yield/equity offer based on behavioral profile.
 */
export const resolveDynamicOffer = (profile: BehavioralProfile, niche: ProjectContextPayload['businessCategory']) => {
  // Institutional Tier Logic
  if (profile.riskProfile === 'low' || profile.investmentStyle === 'yield') {
    return {
      type: 'fixed_yield' as const,
      value: niche === 'defi' ? '14% APY' : '11% Annually',
      description: 'Capital-protected institutional yield with quarterly distributions.'
    };
  }
  
  if (profile.investmentStyle === 'speculative' || profile.riskProfile === 'high') {
    return {
      type: 'equity_upside' as const,
      value: '3.5x Multiplier',
      description: 'High-growth equity allocation with structured exit liquidity.'
    };
  }

  return {
    type: 'access_pass' as const,
    value: 'VIP Genesis',
    description: 'Exclusive tier-1 allocation access for founding partners.'
  };
};

/**
 * Phase 85: Scarcity Engine
 * Computes dynamic time/unit pressure based on project volume.
 */
export const computeScarcity = (project: ProjectContextPayload) => {
  // In a real system, this would query the DB for remaining allocation
  // For Phase 85, we use a deterministic mock based on the day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const slotsRemaining = Math.max(3, 15 - (dayOfYear % 12));
  
  return {
    slotsRemaining,
    deadlineAt: Date.now() + (24 * 60 * 60 * 1000) // 24h urgency
  };
};

/**
 * PURE FUNCTION: Resolves the next state and actions based on psychological funnel.
 */
export function resolveGrowthAction(
  event: GrowthEvent, 
  lead: LeadContextPayload, 
  project?: ProjectContextPayload
): GrowthEngineResult | null {
  const currentLeadState = (lead.metadata?.growth?.state as LeadState) || 'CURIOUS';
  let nextState: LeadState = currentLeadState;
  let actions: GrowthActionType[] = [];

  // --- ADAPTIVE TIMING RESOLVER (Institutional) ---
  const lastWaitlistWelcome = lead.metadata?.growth?.executedActions?.['SEND_WAITLIST_WELCOME_D0'];
  if (lastWaitlistWelcome && typeof lastWaitlistWelcome === 'number') {
    const hoursSinceJoin = (Date.now() - lastWaitlistWelcome) / (1000 * 60 * 60);
    const engagement = lead.engagementLevel || 'mid';
    const intervals: Record<string, { d1: number; d2: number; d3: number }> = {
      'tech_startup': { d1: 24, d2: 48, d3: 72 },
      'real_estate': { d1: 24, d2: 72, d3: 168 },
      'defi': { d1: 6, d2: 12, d3: 24 }, // DeFi is ultra-fast
      'other': { d1: 24, d2: 48, d3: 72 }
    };
    const config = (project?.businessCategory && intervals[project.businessCategory]) 
      ? intervals[project.businessCategory] 
      : intervals['other'];

    const multiplier = engagement === 'critical' ? 0.3 : (engagement === 'high' ? 0.5 : (engagement === 'low' ? 2.0 : 1.0));
    
    if (config && hoursSinceJoin > (config.d3 * multiplier) && !lead.metadata?.growth?.executedActions?.['SEND_WAITLIST_ACTIVATION_D3']) {
      actions.push('SEND_WAITLIST_ACTIVATION_D3');
    } else if (config && hoursSinceJoin > (config.d2 * multiplier) && !lead.metadata?.growth?.executedActions?.['SEND_WAITLIST_STATUS_D2']) {
      actions.push('SEND_WAITLIST_STATUS_D2');
    }
  }

  // --- DETERMINISTIC CLOSING LAYER (Phase 85) ---
  // This layer attempts to close high-priority leads immediately if conditions are met.
  if (project && lead.metadata?.growth?.state === 'HOT' && (lead.priorityScore || 0) > 120) {
    const scarcity = computeScarcity(project);
    const offer = resolveDynamicOffer(lead.profile || { riskProfile: 'medium', investmentStyle: 'yield', convictionScore: 50 }, project.businessCategory);
    
    return {
      nextState: 'HOT', // Remain HOT, but with a specific closing action
      actions: ['SALES_INTERVENTION', 'SEND_DYNAMIC_OFFER'],
      delay: null,
      ruleId: 'PH85_CLOSING_STRIKE',
      ruleCondition: `Deterministic Close: Priority ${lead.priorityScore} in HOT state`,
      offer,
      scarcity
    };
  }

  // Funnel Logic
  switch (event) {
    case 'VIEW_ACCESS' as any: 
    case 'VIEW_ONBOARDING' as any:
    case 'LEAD_CAPTURED':
      nextState = 'AWARE';
      actions = lead.scope === 'b2b' ? ['SEND_WELCOME_B2B_D1'] : ['SEND_WAITLIST_WELCOME_D0'];
      break;

    case 'VIEW_PRICING':
    case 'CLICKED_WHITEPAPER':
      if (currentLeadState === 'CURIOUS' || currentLeadState === 'AWARE') {
        nextState = 'ENGAGED';
      }
      break;

    case 'WALLET_CONNECTED':
    case 'STARTED_KYC':
      nextState = 'HOT';
      actions = ['NOTIFY_TEAM']; // Alert closer immediately
      break;

    case 'PURCHASED':
      nextState = 'INVESTOR';
      actions = ['NOTIFY_TEAM'];
      break;

    case 'BOOKING_CREATED':
      nextState = 'HOT';
      actions = ['SEND_BOOKING_CONFIRMED', 'NOTIFY_TEAM'];
      break;

    case 'EMAIL_OPENED':
      if (currentLeadState === 'CURIOUS') nextState = 'AWARE';
      break;

    case 'COURSE_COMPLETED':
      if (currentLeadState === 'AWARE') nextState = 'ENGAGED';
      actions = ['UNLOCK_REWARD'];
      break;
  }

  // Behavioral State Upgrades (Override focus to HOT if score is massive)
  if (nextState !== 'INVESTOR' && nextState !== 'ARCHIVED') {
    if ((lead.priorityScore || 0) >= 120 || (lead.intentScore || 0) >= 85) {
      nextState = 'HOT';
      if (!actions.includes('NOTIFY_TEAM')) actions.push('NOTIFY_TEAM');
    }
  }

  // Validation
  if (nextState !== currentLeadState) {
    const allowed = ALLOWED_TRANSITIONS[currentLeadState] || [];
    if (!allowed.includes(nextState)) {
      nextState = currentLeadState;
    }
  }

  return { nextState, actions, delay: null, ruleId: `PH80_${event}` };
}

/**
 * ELITE: Natural Score Decay (Institutional)
 */
export function calculateDecayedScore(currentScore: number, lastUpdatedAt: Date | number): number {
  const lastUpdate = typeof lastUpdatedAt === 'number' ? lastUpdatedAt : lastUpdatedAt.getTime();
  const daysIdle = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
  if (daysIdle < 3) return currentScore;
  const decayRate = 5; // -5 points per 3-day window
  return Math.max(0, currentScore - Math.floor(daysIdle / 3) * decayRate);
}

/**
 * ELITE: Intent Classifier (Phase 80)
 */
export function classifyIntent(score: number, status: LeadState): 'low' | 'medium' | 'high' | 'closing' {
  if (status === 'HOT' || score >= 85) return 'closing';
  if (status === 'ENGAGED' || score >= 60) return 'high';
  if (status === 'AWARE' || score >= 30) return 'medium';
  return 'low';
}
