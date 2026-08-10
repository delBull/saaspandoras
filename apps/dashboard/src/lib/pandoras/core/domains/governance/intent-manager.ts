import { StrategyDecision } from '../hermes/events/contracts';
import { OperationalIntent } from '../../contracts/governance-contracts';
import { OperationalIntentRepository } from '../../ports/repositories/operational-intent-repository.interface';
import { PolicyEvaluator } from './policy-evaluator';
import { GovernanceEventBus } from './events/governance-event-bus';
import { ExecutionRequest } from '../../contracts/execution-contracts';

export class IntentManager {

  constructor(
    private readonly repository: OperationalIntentRepository,
    private readonly policyEvaluator: PolicyEvaluator,
    private readonly eventBus: GovernanceEventBus = GovernanceEventBus.getInstance()
  ) {}

  /**
   * Recibe una StrategyDecision (de Hermes) y la traduce en un OperationalIntent.
   */
  async proposeIntent(
    organizationId: string,
    missionId: string,
    packId: string,
    packVersion: string,
    strategyDecisionId: string,
    decision: StrategyDecision
  ): Promise<OperationalIntent> {
    
    // Aquí mapeamos la decisión estratégica a una intención operacional.
    // Esto podría venir del PackManifest, pero por ahora lo construimos.
    const intent: OperationalIntent = {
      id: `intent_${Date.now()}`,
      organizationId,
      missionId,
      packId,
      packVersion,
      strategyDecisionId,
      objective: decision.decision, // e.g. "start lead generation"
      intentType: decision.workflow || 'unknown_intent', // Cambiamos de workflow técnico a tipo de intención, e.g. "lead_generation_campaign"
      rationale: decision.reason.summary, // Usamos el summary estructurado
      
      // Simulamos que el Pack define restricciones por defecto
      constraints: [
        { type: 'budget', value: '50000 MXN' } // Dummy constraint for example
      ],
      approvalPolicy: { required: false }, // Will be evaluated below
      status: 'proposed',
      approvals: [],
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 1. Evaluar Políticas (Governance Check)
    const requiresApproval = this.policyEvaluator.evaluate(intent);
    intent.approvalPolicy.required = requiresApproval;

    if (requiresApproval) {
      intent.status = 'pending_approval';
    } else {
      intent.status = 'approved';
    }

    // 2. Persistir
    const createdIntent = await this.repository.create(intent);

    console.log(`[IntentManager] Proposed intent ${createdIntent.id}. Status: ${createdIntent.status}`);

    // 3. Emitir evento
    this.eventBus.dispatch({
      id: `gevt_${Date.now()}`,
      type: 'OPERATIONAL_INTENT_CREATED',
      organizationId,
      missionId,
      intentId: createdIntent.id,
      aggregateType: 'operational_intent',
      aggregateId: createdIntent.id,
      actorType: 'system',
      occurredAt: new Date(),
      payload: { status: createdIntent.status }
    });

    // Si fue auto-aprobado, emitir también el evento de aprobado y despachar al OS (simulado aquí para simplificar)
    if (createdIntent.status === 'approved') {
       this.eventBus.dispatch({
        id: `gevt_${Date.now()}`,
        type: 'OPERATIONAL_INTENT_APPROVED',
        organizationId,
        missionId,
        intentId: createdIntent.id,
        aggregateType: 'operational_intent',
        aggregateId: createdIntent.id,
        actorType: 'system',
        occurredAt: new Date(),
        actor: 'System',
        payload: { reason: 'Auto-approved by policy' }
      });
      this.dispatchToExecutionOS(createdIntent);
    }

    return createdIntent;
  }

  /**
   * Toma un intent APROBADO y genera el ExecutionRequest para el OS.
   * (Esta función normalmente sería llamada por un listener del evento OPERATIONAL_INTENT_APPROVED)
   */
  public dispatchToExecutionOS(intent: OperationalIntent) {
    if (intent.status !== 'approved') {
      console.warn(`[IntentManager] Cannot dispatch intent ${intent.id} to OS because status is ${intent.status}`);
      return;
    }

    console.log(`[IntentManager] ⚡ Generando ExecutionRequest para el OS basado en intentType: ${intent.intentType}`);
    
    // Aquí es donde el OS resolvería "lead_generation_campaign" a "marketing.lead_generation.v1" 
    // y al provider real (Meta Ads, etc).
    const executionRequest: ExecutionRequest = {
      capability: 'MARKETPLACE', // mock
      context: {
        executionId: `exec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        trigger: 'hermes_intent',
        input: { campaign: 'snarai_launch' },
        identitySnapshot: {
          organization: { id: intent.organizationId, name: '', brand: {}, voice: '', locale: 'es' },
          actor: { userId: 'system', roles: ['agent'] },
          environment: { stage: 'production', timezone: 'UTC', region: 'us-east-1', language: 'es', units: 'metric' },
          capabilities: { available: [] },
          packs: { installed: [intent.packId] },
          providers: {},
          policies: { limits: { budgetUsd: 0, allowedModels: [], securityLevel: 'standard' } },
          metadata: { executionId: '', correlationId: '', traceId: '', sourceApp: 'hermes', version: '1.0' }
        }
      },
      identity: { id: 'system', type: 'AGENT', roles: [] },
      input: { campaign: 'snarai_launch' }
    };

    console.log(`[ExecutionBridge] ExecutionRequest created: ${intent.intentType}`);
    // Enviaríamos esto al InteractionRouter / Execution OS
  }
}
