import { ProactiveSignal } from './signal-registry';
import { ProactivePolicy, DEFAULT_PROACTIVE_POLICY } from './proactive-policy';


export interface TenantContext {
  organizationId: string;
  identity: string; // From ACTIVE knowledge
  soul: string;     // From systemInstructions
  knowledge: any;   // ACTIVE knowledge only
  policy: ProactivePolicy;
  governance: string; // Constraints
}

export interface ContactContext {
  actorId: string;
  conversationMemory: any[];
  journeyState: string;
  behavioralSignals: ProactiveSignal[];
  contactability: {
    canContact: boolean;
    authorizedChannels: string[];
  };
}

export interface ProactiveContext {
  tenant: TenantContext;
  contact: ContactContext;
}

export class ProactiveContextBuilder {
  /**
   * Builds the strictly separated contexts for a proactive decision.
   * C7 & C8: Ensures Contact Memory NEVER leaks into Tenant Knowledge.
   * Ensures only ACTIVE knowledge is returned.
   */
  static async build(
    signal: ProactiveSignal,
    tenantIdentity: string,
    activeKnowledge: any,
    conversationMemory: any[] = []
  ): Promise<ProactiveContext> {
    
    const tenantContext: TenantContext = {
      organizationId: signal.organizationId,
      identity: tenantIdentity,
      soul: 'You are Hermes',
      knowledge: activeKnowledge,
      policy: DEFAULT_PROACTIVE_POLICY,
      governance: "Hermes may detect, reason and propose. Governance decides. Execution OS acts. Proactivity does not grant authority."
    };

    const contactContext: ContactContext = {
      actorId: signal.actorId,
      conversationMemory,
      journeyState: signal.evidence.currentStage || 'UNKNOWN',
      behavioralSignals: [signal],
      contactability: {
        canContact: true,
        authorizedChannels: ['telegram', 'email']
      }
    };

    return {
      tenant: tenantContext,
      contact: contactContext
    };
  }
}
