import { OnboardingStage, HermesOnboardingWorkflow } from '../onboarding-workflow';
import { OnboardingActionProposal } from './types';
import { ONBOARDING_POLICIES } from './policies';
import { OnboardingTransitionValidator } from './validator';
import { HermesRuntime } from '../runtime/hermes-runtime';
import { KnowledgeGovernanceService } from '../knowledge/service';
import { RuntimeMessage } from '../runtime/contracts';
import { ControlPlaneContext, KnowledgeDimension, KnowledgeStatus } from '../knowledge/types';

export class HermesOnboardingOrchestrator {
  private runtime: HermesRuntime;

  constructor(runtime?: HermesRuntime) {
    this.runtime = runtime ?? new HermesRuntime();
  }

  async processTurn(
    organizationId: string,
    currentStage: OnboardingStage,
    message: RuntimeMessage,
    controlPlaneContext: ControlPlaneContext
  ): Promise<{
    replyText: string;
    chips: string[];
    nextStage: OnboardingStage;
  }> {
    
    // 1. If we are in CHANNEL_SETUP, intercept and don't use LLM to collect secrets
    if (currentStage === 'CHANNEL_SETUP') {
      return {
        replyText: '¡Excelente! Hermes ha completado la secuencia de onboarding cognitivo. Tu proyecto ya tiene estructura de Identidad, Conocimiento y Gobernanza activas. Por favor, conecta tus canales de atención (ej. Telegram) en el Dashboard para continuar.',
        chips: ['📱 Conectar Telegram', '🌐 Probar Widget del Portal'],
        nextStage: 'ACTIVATION'
      };
    }

    // 1b. If we are in ACTIVATION, we are fully operating as Hermes
    if (currentStage === 'ACTIVATION') {
      const runtimeResponse = await this.runtime.respond({
        organizationId,
        conversationId: `portal_${organizationId}`,
        message,
        controlPlaneContext
      });

      return {
        replyText: runtimeResponse.content,
        chips: runtimeResponse.suggestedActions.length > 0 
          ? runtimeResponse.suggestedActions 
          : ['🧠 Ir a Hermes KNOW', '📊 Ver Estado del Sistema'],
        nextStage: 'ACTIVATION'
      };
    }

    // 2. Fetch the stage policy
    const policy = ONBOARDING_POLICIES[currentStage];
    if (!policy) {
      throw new Error(`No onboarding policy found for stage: ${currentStage}`);
    }

    // 3. Construct a SYSTEM message to inject the policy into the runtime memory for this turn
    const systemInstruction: RuntimeMessage = {
      id: `sys_${Date.now()}`,
      role: 'SYSTEM',
      content: `[ONBOARDING ORCHESTRATOR]\n${policy.systemInstruction}\nDebes responder SIEMPRE con un objeto JSON válido (sin markdown codeblocks) que cumpla con el esquema OnboardingActionProposal. Requeridos para esta etapa: ${policy.requiredFacts.join(', ')}.\nMensaje del usuario: ${message.content}`,
      createdAt: new Date()
    };

    // 4. Delegate to the Runtime
    // (Note: To ensure the LLM outputs structured data, we are injecting the format request directly into the prompt. 
    // In a future update, we can use the provider's native structured outputs / tool calling capabilities).
    const runtimeResponse = await this.runtime.respond({
      organizationId,
      conversationId: `onboarding_${organizationId}`,
      message: systemInstruction,
      controlPlaneContext
    });

    // 5. Parse the Structured Proposal
    let proposal: OnboardingActionProposal;
    try {
      // Intenta parsear el contenido de la respuesta. 
      // El LLM debería haber respondido con un JSON de acuerdo a la instrucción.
      // (This is a simplified extraction; in production, use a robust parser/tool call).
      let cleanContent = runtimeResponse.content.trim();
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.replace(/```json/g, '');
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.replace(/```/g, '');
      proposal = JSON.parse(cleanContent.trim()) as OnboardingActionProposal;
    } catch (e) {
      console.warn('[HermesOnboardingOrchestrator] Failed to parse proposal. Falling back to ASK_FOLLOW_UP.', e);
      proposal = {
        type: 'ASK_FOLLOW_UP',
        stage: currentStage,
        replyText: runtimeResponse.content // Fallback: just return the raw text
      };
    }

    // 6. Knowledge Discovery Pipeline
    if (proposal.discoveredKnowledge) {
      let dimension: KnowledgeDimension = 'project';
      let status: KnowledgeStatus = 'ACTIVE';

      if (currentStage === 'BUSINESS_DISCOVERY') dimension = 'business_model';
      if (currentStage === 'IDENTITY_CONFIGURATION') dimension = 'identity';
      if (currentStage === 'POLICY_DEFINITION') {
        dimension = 'governance';
        status = 'PENDING_REVIEW';
      }

      // We stringify the discovered facts to store them
      const content = Object.entries(proposal.discoveredKnowledge)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\\n');

      if (content) {
        await KnowledgeGovernanceService.discover(controlPlaneContext, {
          dimension,
          key: `${dimension}_onboarding_${Date.now()}`,
          content: content,
          visibility: 'INTERNAL',
          source: 'ONBOARDING_CONVERSATION',
          sourceReference: message.id,
          status
        });
      }
    }

    // 7. Validation & State Transition
    let nextStage: OnboardingStage = currentStage;
    if (proposal.type === 'STAGE_READY') {
      const validation = OnboardingTransitionValidator.validate(proposal);
      if (validation.isReady) {
        const workflowTransitions = HermesOnboardingWorkflow.transitions?.[currentStage] ?? [];
        nextStage = (workflowTransitions[0] as OnboardingStage) ?? currentStage;
      } else {
        // Force fallback if LLM jumped the gun
        proposal.type = 'ASK_FOLLOW_UP';
        proposal.replyText += `\\n(Nota interna: ${validation.reason})`;
      }
    }

    // 8. Determine Chips (suggested actions)
    let chips: string[] = [];
    if (nextStage !== currentStage) {
      chips = ['Continuar a la siguiente etapa'];
    }

    return {
      replyText: proposal.replyText,
      chips: chips,
      nextStage
    };
  }
}
