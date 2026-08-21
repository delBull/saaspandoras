/**
 * 📦 Hermes OS QA Scenario Catalog (E01 - E34)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/scenarios/index.ts
 */

import { GOVERNANCE_SCENARIOS } from './governance-scenarios';
import { MEMORY_SCENARIOS } from './memory-scenarios';
import { OBJECTION_SCENARIOS } from './objection-scenarios';
import { FOLLOW_UP_SCENARIOS } from './follow-up-scenarios';
import { INTERACTIVE_SCENARIOS } from './interactive-scenarios';
import { FULL_FUNNEL_SCENARIOS } from './full-funnel-scenarios';
import { SECURITY_SCENARIOS } from './security-scenarios';
import { QAScenario } from '../types';

export const ALL_QA_SCENARIOS: QAScenario[] = [
  ...GOVERNANCE_SCENARIOS,   // E01 - E05
  ...MEMORY_SCENARIOS,       // E06 - E10
  ...OBJECTION_SCENARIOS,    // E11 - E14
  ...FOLLOW_UP_SCENARIOS,    // E15 - E17
  ...INTERACTIVE_SCENARIOS,  // E18 - E20
  ...FULL_FUNNEL_SCENARIOS,  // E21 - E30
  ...SECURITY_SCENARIOS      // E31 - E34
];

export {
  GOVERNANCE_SCENARIOS,
  MEMORY_SCENARIOS,
  OBJECTION_SCENARIOS,
  FOLLOW_UP_SCENARIOS,
  INTERACTIVE_SCENARIOS,
  FULL_FUNNEL_SCENARIOS,
  SECURITY_SCENARIOS
};
