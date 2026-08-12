import { ExecutionRequest, ExecutionResult } from '../contracts/universal';

/**
 * 👑 Pandora's Platform OS — Compatibility Provider
 * 
 * Provides a transitional execution boundary for old telegram bot logic.
 * This ensures the Kernel (Hermes.execute) remains pure while we migrate
 * the business logic to native capability providers in Sprint 8.
 */
export class CompatibilityProvider {
  public static async execute(context: ExecutionRequest): Promise<ExecutionResult> {
    const { capability, channel } = context;
    const { userMessage, chatId, projectId, botToken, raw } = context.payload;

    console.log(`[CompatibilityProvider] Routing legacy capability: ${capability}`);

    const { handleTelegramMessage, handleTelegramCallback, escapeMarkdown, sendTelegramMessage } = require('../telegram-runtime/router');
    const { generateBotResponse } = require('@/lib/marketing/bot-engine');
    const { getLivePhaseData } = require('../telegram-runtime/live-phases');
    const { mainMenuKeyboard, reunionKeyboard, buySelectorKeyboard } = require('../telegram-runtime/keyboards');

    let reply = 'La acción solicitada no está implementada en el Compatibility Provider.';
    
    try {
      const mappedCtx = this.mapContext(context);

      // Phase 1 Certification: Route S'Narai explicitly to native HermesKernel v1.1
      if (mappedCtx.project?.slug === 'snarai' || mappedCtx.projectId === 'snarai' || context.tenantId === '2') {
        console.log(`[CompatibilityProvider] 🚀 Intercepting S'Narai execution and routing to native HermesKernel v1.1`);
        
        const { HermesKernel } = require('../runtimes/hermes-kernel');
        const { DomainPackLoader } = require('../packs/domain-pack-loader');
        
        const kernel = new HermesKernel();
        // Load the pack explicitly to prove it reaches runtime (Throws DomainPackNotFound if invalid)
        const domainPack = await DomainPackLoader.load(mappedCtx.project?.slug || 'snarai');
        
        const experience = await kernel.processInput({
          tenantId: mappedCtx.project?.id || 2,
          sessionId: chatId.toString(),
          input: userMessage,
          artifacts: {
            domainPack // Injected for JourneyEngine and LLM Providers
          },
          state: {}
        });
        
        return this.success(experience.actions.messages.join('\n') || '');
      }

      // 1. Handle Callback Queries (Inline Buttons)
      if (raw?.callback_query) {
        await handleTelegramCallback({
          projectId: mappedCtx.projectId,
          project: mappedCtx.project,
          metadata: mappedCtx.metadata,
          botToken: botToken,
          callbackQueryId: raw.callback_query.id,
          chatId: mappedCtx.chatId,
          data: raw.callback_query.data || ''
        });
        return this.success('');
      }

      // 2. Handle Text Messages via Router
      const structured = await handleTelegramMessage({
        projectId: mappedCtx.projectId, // This is now the slug!
        project: mappedCtx.project,
        metadata: mappedCtx.metadata,
        botToken: botToken,
        chatId: mappedCtx.chatId,
        text: userMessage,
        firstName: raw?.message?.from?.first_name
      });

      if (structured.handled) {
        // Router internally calls sendTelegramMessage. 
        // Return empty so the webhook doesn't double send.
        return this.success('');
      }

      // 3. Fallback to Free-Form LLM
      const live = await getLivePhaseData(mappedCtx.project);
      const activePhase = live.activePhase;
      const liveContext = {
        title: mappedCtx.project.title || 'S\'Narai',
        slug: mappedCtx.project.slug || 'snarai',
        currentPrice: activePhase?.tokenPrice || mappedCtx.metadata?.tokenPriceUsd || 50,
        phaseName: activePhase?.name || 'Fase Fundadores',
        progressPercentage: activePhase?.status.percent || mappedCtx.metadata?.progressPercentage || 0,
        availableUnits: activePhase?.status.isSoldOut ? 0 : (mappedCtx.metadata?.availableUnits || 30000)
      };

      const botInstructions = mappedCtx.metadata?.aiKnowledgeBase || mappedCtx.metadata?.botConfig?.instructions;
      const replyObj = await generateBotResponse({
        userMessage: userMessage,
        chatId: chatId.toString(),
        projectSlug: projectId,
      });
      reply = replyObj.replyText || '';

      if (replyObj.action === 'OFFER_CALL') {
        await sendTelegramMessage(botToken, mappedCtx.chatId, reply, reunionKeyboard());
        return this.success('');
      } else if (replyObj.action === 'SEND_CHECKOUT') {
        await sendTelegramMessage(botToken, mappedCtx.chatId, reply, buySelectorKeyboard());
        return this.success('');
      }

    } catch (e: any) {
      console.error('[CompatibilityProvider] Error executing legacy logic:', e);
      reply = 'Hubo un error al ejecutar la acción de compatibilidad.';
    }

    return this.success(reply);
  }

  private static success(reply: string): ExecutionResult {
    return {
      status: 'completed',
      events: [{ type: 'DELEGATED_TO_COMPATIBILITY', to: 'CompatibilityProvider' }],
      artifacts: [
        { id: 'reply', type: 'message', content: reply }
      ]
    };
  }

  private static mapContext(context: ExecutionRequest) {
    // Requires a fetch from DB to get the real project and metadata for the old router
    // This is synchronous in nature here but we will rely on raw if we can't fetch.
    // However, the CompatibilityProvider is a transition layer so we do what we must.
    return {
      projectId: context.payload.raw?.projectRecord?.slug || context.payload.projectId.toString(),
      project: context.payload.raw?.projectRecord || { id: context.payload.projectId },
      metadata: context.payload.raw?.metadata || {},
      botToken: context.payload.botToken || '', // Bot token injected from Adapter
      chatId: context.payload.chatId
    };
  }
}
