import { LeadState, GrowthEvent, GrowthEngineResult, LeadContextPayload, ALLOWED_TRANSITIONS, GrowthActionType } from './types';

/**
 * PURE FUNCTION: Resolves the next state and actions based on an event.
 * Absolutely NO side effects (no db calls, no external apis).
 */
export function resolveGrowthAction(event: GrowthEvent, lead: LeadContextPayload): GrowthEngineResult | null {
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
      } else if (normalizedIntent === 'explore') {
        nextState = 'EXPLORE';
        actions = ['SEND_WELCOME_EXPLORE_D1', 'NOTIFY_TEAM', 'ASSIGN_COURSE'];
      } else if (normalizedIntent === 'invest' || normalizedIntent === 'whitelist') {
        nextState = 'INVEST_READY';
        actions = ['SEND_WELCOME_INVEST_D1', 'NOTIFY_TEAM', 'ASSIGN_COURSE'];
      } else {
        nextState = 'EXPLORE';
        actions = ['SEND_WELCOME_EXPLORE_D1', 'NOTIFY_TEAM', 'ASSIGN_COURSE'];
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

    case 'BOOKING_CREATED':
      nextState = 'SCHEDULED';
      actions = ['SEND_CALL_REMINDER_D3', 'SEND_CALL_REMINDER_D1', 'NOTIFY_TEAM'];
      break;

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

  return {
    nextState,
    actions,
    delay: null
  };
}
