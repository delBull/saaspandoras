/**
 * 👑 Pandora's Platform OS — Hermes Execution Engine (v5 Kernel)
 * lib/hermes/execution-engine.ts
 *
 * Chief Orchestrator of Hermes OS v5.
 * Coordinates:
 *   1. Interaction Router (Intent & Confidence)
 *   2. 4 Memory Layers (Conversation, Customer, Org, Platform)
 *   3. Policy Engine (Rules & Safety)
 *   4. Capability Dispatcher (Tool execution)
 *   5. LLM Engine (Response generation)
 *   6. Event Bus (Event emission)
 */

import { InteractionRouter, RouteResult } from './interaction-router';
import { MemoryLayersResolver, MemoryLayersContext } from './memory-layers';
import { PolicyEngine } from './policy-engine';
import { CapabilityDispatcher } from './capability-dispatcher';
import { HermesEventBus } from './event-bus';
import { HumanHandoffProtocol } from './human-handoff';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

export interface ExecutionInput {
  projectId: number;
  chatId: string;
  userMessage: string;
  channel: string;
}

export interface ExecutionOutput {
  reply: string;
  intent: string;
  requiresHuman: boolean;
  actionExecuted?: string;
}

export class ExecutionEngine {
  static async execute(input: ExecutionInput): Promise<ExecutionOutput> {
    const { projectId, chatId, userMessage, channel } = input;

    // 1. Resolve Organization Context
    const orgContext = await OrganizationSDK.resolve(projectId, 'HERMES');
    const installed = orgContext.activeProduct;

    if (!installed || installed.status === 'suspended') {
      throw new Error(`[ExecutionEngine] Hermes product is inactive for project ${projectId}`);
    }

    // 2. Check if chat is paused via Human Handoff
    const isPaused = await HumanHandoffProtocol.isPaused(projectId, chatId);
    if (isPaused) {
      return {
        reply: 'Un asesor humano ha tomado tu conversación. Te responderemos en breve.',
        intent: 'HUMAN_ESCALATION',
        requiresHuman: true,
      };
    }

    // 3. Step 1: Interaction Router (Intent Classification)
    const routeResult = InteractionRouter.route(userMessage);

    // Emit event: ConversationStarted
    await HermesEventBus.emit('ConversationStarted', projectId, chatId, { channel, intent: routeResult.intent });

    // 4. Step 2: 4 Memory Layers Resolver
    const memory = await MemoryLayersResolver.resolve(projectId, chatId, userMessage);

    // 5. Step 3: Policy Engine Evaluation
    const policyResult = PolicyEngine.evaluate({
      projectId,
      intent: routeResult.intent,
      userMessage,
      crmStage: memory.customerMemory.crmStage,
      capabilities: orgContext.capabilities,
    });

    if (!policyResult.allowed) {
      return {
        reply: policyResult.blockedReason || 'La acción solicitada no está permitida.',
        intent: routeResult.intent,
        requiresHuman: false,
      };
    }

    // Handle Human Escalation trigger if confidence < 70% or explicit
    if (routeResult.requiresHuman || routeResult.confidence < 70) {
      await HumanHandoffProtocol.triggerHandoff({
        projectId,
        chatId,
        reason: routeResult.reason,
        lastUserMessage: userMessage,
      });

      await HermesEventBus.emit('CustomerEscalated', projectId, chatId, { reason: routeResult.reason });

      return {
        reply: 'He notificado a nuestro equipo ejecutivo para que te atienda personalmente. Un momento por favor.',
        intent: routeResult.intent,
        requiresHuman: true,
      };
    }

    // 6. Step 4: Capability Dispatcher (if structured action required)
    let actionExecuted = undefined;
    let actionSummary = '';

    if (routeResult.intent === 'APPOINTMENT_REQUEST' && orgContext.capabilities.calendar) {
      const dispatchRes = await CapabilityDispatcher.dispatch({
        capability: 'calendar.schedule',
        projectId,
        payload: { requestedSlot: 'Próxima fecha disponible' },
      });
      actionExecuted = dispatchRes.actionExecuted;
      actionSummary = `\n[ACCION EJECUTADA: ${dispatchRes.userSummary}]`;
      await HermesEventBus.emit('AppointmentCreated', projectId, chatId, dispatchRes.data);
    }

    // 7. Step 5: Construct System Prompt & LLM Execution
    const orgMem = memory.organizationMemory;
    const knowledgeText = `
BASE DE CONOCIMIENTO CONFIGURADA POR LA EMPRESA (${orgMem.companyName}):
- Industria: ${orgMem.industry}
- Horario de Atención: ${orgMem.schedule}
- Servicios / Productos Clave: ${orgMem.services.join(', ')}
- Preguntas Frecuentes (FAQs):
${orgMem.faqs.map(f => `  * Q: ${f.question}\n    A: ${f.answer}`).join('\n')}
    `;

    const customSystemPrompt = (installed.config as any)?.prompt || `Eres Hermes, el Agente Autónomo de ${orgContext.name}. Atiende a los clientes con amabilidad y precisión.`;
    const fullSystemPrompt = `${customSystemPrompt}\n\nINTENCIÓN DETECTADA: ${routeResult.intent}${actionSummary}\n\n${knowledgeText}\n\nREGLAS DE PLATAFORMA:\n${memory.platformMemory.playbookRules.join('\n')}`;

    const botReplyObj = await generateBotResponse({
      userMessage,
      chatId,
      projectSlug: orgContext.slug,
      projectName: orgContext.name,
      customSystemPrompt: fullSystemPrompt,
      projectContext: {
        title: orgContext.name,
        slug: orgContext.slug,
      },
    });

    return {
      reply: botReplyObj.replyText || "Lo siento, no pude procesar tu solicitud.",
      intent: routeResult.intent,
      requiresHuman: false,
      actionExecuted,
    };
  }
}
