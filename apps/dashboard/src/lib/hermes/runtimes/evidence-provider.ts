import { IDecisionProvider } from './decision-provider';
import { Decision, KernelContext, Capability } from './kernel-types';

export class EvidenceProvider implements IDecisionProvider {
  id = 'EvidenceProvider';
  providedCapabilities: Capability[] = ['knowledge.query'];
  requiredCapabilities: Capability[] = [];

  canHandle(context: KernelContext): number {
    return context.artifacts.domainPack?.evidenceLayer ? 1.0 : 0.0;
  }

  async generateDecision(context: KernelContext): Promise<Decision[]> {
    const evidenceLayer = context.artifacts.domainPack?.evidenceLayer;
    if (!evidenceLayer) return [];

    const inputLower = context.input.toLowerCase();
    
    // Simplistic intent matching for demonstration (in production, use LLM intent extraction)
    const keywordsMap: Record<string, string[]> = {
      'LIQUIDITY_CLAIM': ['\\bliquidez\\b', '\\bvender\\b', '\\bretirar\\b', '\\bsalida\\b'],
      'LEGAL_CLAIM': ['\\bacción\\b', '\\bacciones\\b', '\\bfideicomiso\\b', '\\bsmart contract', '\\bvoto\\b', '\\bgobernanza\\b', '\\blegal\\b'],
      'FINANCIAL_CLAIM': ['\\bfondeo\\b', '\\bdevolución\\b', '\\bcapital\\b', '\\bmínimo\\b'],
      'PERFORMANCE_CLAIM': ['\\brendimiento\\b', '\\bgarantizado\\b', '\\bganancia\\b', '\\broi\\b'],
    };

    let detectedClassifications: string[] = [];
    for (const [classification, keywords] of Object.entries(keywordsMap)) {
      if (keywords.some(kw => new RegExp(kw, 'i').test(inputLower))) {
        detectedClassifications.push(classification);
      }
    }

    if (detectedClassifications.length === 0) return [];

    // Find first relevant claim that is NOT verified
    const unverifiedClaim = evidenceLayer.find((claim: any) => 
      detectedClassifications.includes(claim.classification) && !claim.isVerified
    );

    if (unverifiedClaim) {
      return [{
        source: this.id,
        type: 'communicate',
        authority: 'HIGH', // Overrides standard Ollama AI chatter
        priority: 900,
        confidence: 1.0,
        blocking: true, // Prevents LLM hallucination
        payload: { task: unverifiedClaim.allowedResponse }
      }];
    }

    return [];
  }
}
