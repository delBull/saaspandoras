import { CompiledExecutionManifest, IPipelineRuntime } from './orchestrator-types';
import { ProspectIdentityResolver } from './prospect-identity-resolver';
import { ProspectIntelligenceService } from './prospect-intelligence-service';
import { ProspectStrategyService } from './prospect-strategy-service';
import { IdentityIdentifiers } from '@/lib/marketing/identity-resolver';

/**
 * Prospect Intelligence Runtime
 * 
 * Pipeline Stage 1.5.
 * 
 * Resolves the Canonical Identity from the client's hint, loads the Prospect Context,
 * enforces privacy boundaries, and injects the context into the execution manifest.
 * This MUST run before KnowledgeRuntime so the context can be used to filter knowledge.
 */
export class ProspectIntelligenceRuntime implements IPipelineRuntime {
  async process(manifest: CompiledExecutionManifest, input: string): Promise<void> {
    // 1. Extract Identity Hint from the manifest or events
    // In a real flow, the client might pass email or fingerprint in the initial request
    // For now, we assume it's passed somehow, perhaps in userId or we just use a generic fingerprint
    const hint: IdentityIdentifiers = {
      // Use the provided userId as a hint, or a fallback fingerprint for anonymous sessions
      userId: manifest.userId,
      fingerprint: manifest.sessionId, // Using sessionId as a temporary fingerprint for anonymous users
    };

    try {
      // 2. Resolve Canonical Identity (Server-side Authority)
      const identity = await ProspectIdentityResolver.resolve(hint);

      // 3. Load full Intelligence Context
      const rawContext = await ProspectIntelligenceService.buildInitialContext(identity);

      // 4. Apply Privacy/Scope Filters
      const safeContext = ProspectIntelligenceService.applyPrivacyFilter(rawContext, {
        allowRestrictedFacts: false,
        allowCrossTenantFacts: false,
      });

      // 4.5. Generate Deterministic Strategy
      safeContext.strategy = ProspectStrategyService.defineStrategy(safeContext);

      // 5. Inject into Manifest
      manifest.prospectContext = safeContext;
      console.log(`[ProspectIntelligenceRuntime] Bound context for Canonical Identity: ${identity.canonicalId}`);
    } catch (error) {
      console.warn(`[ProspectIntelligenceRuntime] Failed to resolve prospect intelligence:`, error);
      // Fail closed: Do not inject a partial or spoofed context
    }
  }
}
