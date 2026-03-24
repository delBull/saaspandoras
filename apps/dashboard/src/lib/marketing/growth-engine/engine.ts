import { LeadState, GrowthEvent, GrowthEngineResult, LeadContextPayload, ALLOWED_TRANSITIONS, GrowthActionType, ProjectContextPayload } from './types';

/**
 * PURE FUNCTION: Resolves the next state and actions based on an event.
 * Absolutely NO side effects (no db calls, no external apis).
 */
export function resolveGrowthAction(event: GrowthEvent, lead: LeadContextPayload, project?: ProjectContextPayload): GrowthEngineResult | null {
  // 1. Current State Identification
  const currentLeadState = (lead.metadata?.growth?.state as LeadState) || 'NEW';
  let nextState: LeadState = currentLeadState;
  let actions: GrowthActionType[] = [];

  // 2. Normalization for backward compatibility
  const normalizedIntent = typeof lead.intent === 'string' ? lead.intent.toLowerCase() : 'explore';

  // 3. State Engine Logic
  // Special Rule: If lead is already SCHEDULED or CONVERTED, we block most passive events
  if (currentLeadState === 'SCHEDULED' && event === 'LEAD_CAPTURED') {
      return { nextState: 'SCHEDULED', actions: [], delay: null };
  }
  switch (event) {
    case 'LEAD_CAPTURED':
      if (lead.scope === 'b2b') {
        nextState = 'INVEST_READY';
        actions = ['SEND_WELCOME_B2B_D1', 'NOTIFY_TEAM'];
        return { 
          nextState, actions, delay: null, 
          ruleId: 'WELCOME_B2B', 
          ruleCondition: 'Scope is B2B' 
        };
      } else if (normalizedIntent === 'explore') {
        nextState = 'EXPLORE';
        actions = ['SEND_WELCOME_EXPLORE_D1', 'NOTIFY_TEAM', 'ASSIGN_COURSE'];
        return { 
          nextState, actions, delay: null, 
          ruleId: 'WELCOME_EXPLORE', 
          ruleCondition: 'Intent is Explore' 
        };
      } else if (normalizedIntent === 'invest' || normalizedIntent === 'whitelist') {
        nextState = 'INVEST_READY';
        actions = ['SEND_WELCOME_INVEST_D1', 'NOTIFY_TEAM', 'ASSIGN_COURSE'];
        return { 
          nextState, actions, delay: null, 
          ruleId: 'WELCOME_INVEST', 
          ruleCondition: 'Intent is Invest/Whitelist' 
        };
      }
      break;

    case 'COURSE_STARTED':
      if (currentLeadState === 'EXPLORE') {
          nextState = 'EDUCATING';
      }
      break;

    case 'COURSE_COMPLETED':
      if (currentLeadState === 'EXPLORE' || currentLeadState === 'EDUCATING') {
          nextState = 'ENGAGED';
          actions = ['UNLOCK_REWARD'];
      }
      break;

    case 'WALLET_CONNECTED':
      nextState = 'INVEST_READY';
      actions = ['SEND_OFFER'];
      break;

    case 'PURCHASED':
      nextState = 'CONVERTED';
      actions = ['NOTIFY_TEAM'];
      break;

    case 'VIEW_PRICING':
      return { 
          nextState: currentLeadState, 
          actions: [], 
          scoreChange: 10, 
          priority: 10, 
          delay: null,
          ruleId: 'SCORE_VIEW_PRICING',
          ruleCondition: 'User viewed pricing page'
      };

    case 'SELECT_TIER':
      return { 
          nextState: currentLeadState, 
          actions: [], 
          scoreChange: 25, 
          priority: 25, 
          delay: null,
          ruleId: 'SCORE_SELECT_TIER',
          ruleCondition: 'User selected a pricing tier'
      };

    case 'BOOKING_CREATED':
      nextState = 'SCHEDULED';
      actions = ['SEND_CALL_REMINDER_D3', 'SEND_CALL_REMINDER_D1', 'NOTIFY_TEAM'];
      return { nextState, actions, scoreChange: 50, priority: 80, delay: null };

    case 'BOOKING_CONFIRMED':
      if (currentLeadState === 'SCHEDULED' || currentLeadState === 'INVEST_READY') {
          nextState = 'SCHEDULED';
          actions = ['SEND_BOOKING_CONFIRMED', 'NOTIFY_TEAM'];
      }
      break;

    case 'BOOKING_CANCELLED':
      if (currentLeadState === 'SCHEDULED') {
        nextState = 'NURTURING';
        actions = ['NOTIFY_TEAM'];
      }
      break;

    case 'BOOKING_NO_SHOW':
      if (currentLeadState === 'SCHEDULED') {
        nextState = 'NURTURING';
        actions = ['SEND_NO_SHOW_RECOVERY', 'NOTIFY_TEAM'];
      }
      break;

    case 'CALL_COMPLETED': {
        const outcome = lead.metadata?.call?.outcome || 'warm'; 
        if (outcome === 'hot') {
            nextState = 'INVEST_READY';
            actions = ['SEND_SOW', 'NOTIFY_TEAM'];
            return { 
                nextState, actions, scoreChange: 100, priority: 100, delay: null,
                ruleId: 'HOT_CALL_CLOSING',
                ruleCondition: 'Call marked as HOT'
            };
        } else if (outcome === 'warm') {
            nextState = 'NURTURING';
            return { 
                nextState, actions: ['NOTIFY_TEAM'], scoreChange: 20, priority: 50, delay: null,
                ruleId: 'WARM_CALL_NURTURE',
                ruleCondition: 'Call marked as WARM'
            };
        } else if (outcome === 'nocall' || outcome === 'no_show') {
            nextState = 'NURTURING';
            actions = ['SEND_NO_SHOW_RECOVERY', 'NOTIFY_TEAM'];
            return {
                nextState, actions, delay: null,
                ruleId: 'NO_SHOW_RECOVERY',
                ruleCondition: 'Call no-show'
            };
        }
        break;
    }

    case 'SOW_EXPIRED':
      return { 
          nextState: 'NURTURING', 
          actions: ['SEND_FOLLOWUP_B2B_D2'], 
          scoreChange: -25, 
          priority: 30, 
          delay: null,
          ruleId: 'FEEDBACK_SOW_EXPIRED',
          ruleCondition: 'SOW not signed within window'
      };

    case 'EMAIL_BOUNCED':
      return { 
          nextState: 'ARCHIVED', 
          actions: [], 
          scoreChange: -100, 
          priority: 90, 
          delay: null,
          ruleId: 'FEEDBACK_BOUNCE',
          ruleCondition: 'Communication channel failed'
      };

    default:
      console.warn(`[Growth Engine] Unhandled event: ${event}`);
  }

  // 4. Final Transition Validation (Audit Fix 3)
  if (nextState !== currentLeadState) {
      const allowed = ALLOWED_TRANSITIONS[currentLeadState] || [];
      if (!allowed.includes(nextState)) {
          console.warn(`[Growth Engine] Blocked invalid transition: ${currentLeadState} -> ${nextState} for ${lead.email}`);
          return {
              nextState: currentLeadState,
              actions: [], 
              delay: null
          };
      }
  }

  // 5. Intelligent Intent Automation (Surgical: Audit 5)
  const currentIntent = classifyIntent(lead.score || 0, nextState, lead.metadata, (lead as any).updatedAt || (lead as any).createdAt);
  if (currentIntent === 'closing' && !actions.includes('NOTIFY_TEAM')) {
      actions.push('NOTIFY_TEAM');
  }

  return {
    nextState,
    actions,
    delay: null
  };
}

/**
 * ELITE: Natural Score Decay (Audit 3: Surgical Refinement)
 * Calculates the hypothetical decayed score based on inactivity, aware of intent.
 */
export function calculateDecayedScore(
    currentScore: number, 
    lastUpdatedAt: Date | number,
    intent: 'low' | 'medium' | 'high' | 'closing' = 'low',
    metadata: any = {}
): number {
    const lastUpdate = typeof lastUpdatedAt === 'number' ? lastUpdatedAt : lastUpdatedAt.getTime();
    const now = Date.now();
    const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);

    // Extreme: Pause decay if lead engaged recently (Engagement-Based Protection)
    const lastEngagedAt = metadata?.lastEngagedAt || metadata?.growth?.lastEngagedAt || 0;
    const hoursSinceEngagement = (now - (typeof lastEngagedAt === 'string' ? new Date(lastEngagedAt).getTime() : lastEngagedAt)) / (1000 * 60 * 60);

    if (hoursSinceEngagement < 72) {
        // console.log(`[Growth OS] Decay paused due to activity within 72h`);
        return currentScore;
    }
    
    // Surgical Rates: Closing deals are protected
    const rates = {
        'closing': 2, // -2 every 3 days
        'high': 3,    // -3 every 3 days
        'medium': 5,  // -5 every 3 days
        'low': 5
    };
    
    const rate = rates[intent] || 5;
    const decayIntervals = Math.floor(daysSinceUpdate / 3);
    if (decayIntervals <= 0) return currentScore;
    
    const decayAmount = decayIntervals * rate;
    return Math.max(0, currentScore - decayAmount);
}

/**
 * ELITE: Intent Classifier (Audit 8: Surgical Refincement)
 * Maps lead state to actionable intent buckets with Recency weighting.
 */
export function classifyIntent(score: number, status: LeadState, metadata: any, lastUpdatedAt?: Date | number): 'low' | 'medium' | 'high' | 'closing' {
    const outcome = metadata?.lastCallOutcome || metadata?.call?.outcome;
    
    // Recency Weight (Elite Surgical)
    const lastUpdate = lastUpdatedAt ? (typeof lastUpdatedAt === 'number' ? lastUpdatedAt : lastUpdatedAt.getTime()) : Date.now();
    const daysIdle = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
    
    // Activity Bonus: Active today/yesterday gets +10 virtual intent score
    const recencyBonus = daysIdle < 2 ? 10 : (daysIdle > 10 ? -20 : 0);
    const intentScore = score + recencyBonus;
    
    // Dynamic Bucketization
    if (status === 'INVEST_READY' || outcome === 'hot' || intentScore > 90) return 'closing';
    if (status === 'SCHEDULED' || status === 'ENGAGED' || intentScore > 70) return 'high';
    if (intentScore > 40 || status === 'EDUCATING') return 'medium';
    return 'low';
}
