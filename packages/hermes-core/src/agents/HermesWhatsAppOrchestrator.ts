/**
 * 📲 HermesWhatsAppOrchestrator (Canonical Export)
 * apps/dashboard/src/lib/hermes/agents/HermesWhatsAppOrchestrator.ts
 *
 * Re-exports HermesOutboundDispatcher to maintain backward-compatibility
 * with callers while adhering to the canonical Hermes Kernel -> Channel Adapter architecture.
 */

export { 
  HermesOutboundDispatcher,
  HermesWhatsAppOrchestrator,
  type OutboundDispatchResult 
} from './HermesOutboundDispatcher';
