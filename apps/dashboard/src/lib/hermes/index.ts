/**
 * 🏛️ HERMES AI REVENUE ENGINE — Module Index
 * Five-Engine Horizontal Architecture (v1.0)
 *
 * Phase 1 — Core Intelligence:
 *   KnowledgePackLoader, SalesStateMachineEngine, HermesDecisionEngine
 * Phase 2 — Communications Layer:
 *   Telegram InlineKeyboard (in webhook route)
 * Phase 3 — Commerce Engine:
 *   HermesCommerceEngine
 * Phase 4 — Intelligence Layer:
 *   HermesIntelligenceEngine
 * Phase 5 — B2B Marketplace (Agency Vault):
 *   /app/agency/vault/page.tsx
 */

export { KnowledgePackLoader, SNARAI_KNOWLEDGE_PACK } from './knowledge-pack';
export { SalesStateMachineEngine } from './state-machine';
export { HermesDecisionEngine } from './decision-engine';
export { HermesCommerceEngine } from './commerce-engine';
export { HermesIntelligenceEngine } from './intelligence-engine';
export type {
  SalesState,
  CustomerMemory,
  KnowledgePack,
  HermesMission,
} from './types';
export type { CommerceCheckoutSession } from './commerce-engine';
export type { AnonymousBehaviorEvent } from './intelligence-engine';
