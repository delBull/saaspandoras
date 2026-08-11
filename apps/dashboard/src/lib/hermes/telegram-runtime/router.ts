import { InteractionRouter, RouteResult } from '../interaction-router';
import { HermesJourneyEngine } from '../journey-engine';
import { SalesStateMachineEngine } from '../state-machine';
import { HumanHandoffProtocol } from '../human-handoff';
import { HermesIntelligenceEngine } from '../intelligence-engine';
import { KnowledgePackLoader } from '../knowledge-pack';
import { HermesCommerceEngine } from '../commerce-engine';
import { SalesState } from '../types';
import { getTelegramState, saveTelegramState, TelegramLeadState } from './state';
import { getLivePhaseData } from './live-phases';
import {
  mainMenuKeyboard,
  thesisKeyboard,
  phasesKeyboard,
  dataroomStep1Keyboard,
  dataroomFullKeyboard,
  buySelectorKeyboard,
  buyWeb3Keyboard,
  buySpeiKeyboard,
  reunionKeyboard,
  positionKeyboard,
  buildCheckoutUrl
} from './keyboards';
import {
  welcomeMessage,
  thesisMessage,
  phasesMessage,
  dataroomStep1Message,
  dataroomDossierMessage,
  buySelectorMessage,
  buyWeb3Message,
  buySpeiMessage,
  reunionMessage,
  reunionAskEmailMessage,
  reunionRegisteredMessage,
  positionMessage
} from './messages';
import { isValidEmail } from '@/lib/security-utils';

export interface TelegramBotResult {
  handled: boolean;
  paused?: boolean;
  replyText?: string;
}

interface BaseContext {
  projectId: string;
  project: any;
  metadata: any;
  botToken: string;
  chatId: number;
}

export function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]`])/g, '\\$1');
}

async function tgPost(token: string, method: string, payload: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[Telegram Bot] ${method} failed:`, errText);
    return null;
  }
  return res.json();
}

export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: { inline_keyboard: unknown[][] },
  parseMode: 'Markdown' | 'MarkdownV2' | 'HTML' | undefined = 'Markdown'
) {
  return tgPost(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  });
}

async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string) {
  await tgPost(token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {})
  });
}

/**
 * Deterministic state progression. Uses the Sales State Machine when the
 * transition is valid, otherwise walks the closest valid ladder.
 */
function advanceSalesState(current: SalesState, target: SalesState): SalesState {
  const direct = SalesStateMachineEngine.transition(current, target);
  if (direct.success) return target;

  if (target === 'NEGOTIATION') {
    if (current === 'NEW') return 'ENGAGED';
  }
  if (target === 'READY') {
    if (current === 'NEW' || current === 'CONTACTED') return 'ENGAGED';
    if (current === 'ENGAGED') return 'NEGOTIATION';
    return 'READY';
  }
  if (target === 'QUALIFIED') {
    if (current === 'NEW') return 'CONTACTED';
  }
  return current;
}

function recordEvent(
  projectId: string,
  eventType: 'VIEWED_PHASE' | 'DOWNLOADED_DOSSIER' | 'HANDLED_OBJECTION' | 'INITIATED_CHECKOUT' | 'FASTLANE_RESERVATION',
  metadata?: Record<string, unknown>
) {
  try {
    HermesIntelligenceEngine.recordBehaviorEvent({
      projectSlug: projectId,
      eventType,
      channel: 'telegram',
      metadata
    });
  } catch (e) {
    console.warn('[Telegram Bot] Intelligence event error:', e);
  }
}

async function sendMainMenu(ctx: BaseContext, firstName?: string) {
  await sendTelegramMessage(ctx.botToken, ctx.chatId, welcomeMessage(firstName), mainMenuKeyboard());
}

async function handleBuy(ctx: BaseContext, state: TelegramLeadState) {
  const pack = KnowledgePackLoader.getPack(ctx.projectId, ctx.metadata);
  const reply = buySelectorMessage(pack);
  await sendTelegramMessage(ctx.botToken, ctx.chatId, reply, buySelectorKeyboard());

  recordEvent(ctx.projectId, 'INITIATED_CHECKOUT');

  await saveTelegramState(ctx.project.id, String(ctx.chatId), {
    salesState: advanceSalesState(state.salesState, 'READY'),
    expressedIntent: 'invest',
    lastAction: 'buy'
  });

  return reply;
}

async function handleObjection(ctx: BaseContext, state: TelegramLeadState, text: string) {
  const pack = KnowledgePackLoader.getPack(ctx.projectId, ctx.metadata);
  const matched = pack.objectionRules.find((rule) => {
    try {
      return new RegExp(rule.triggerPattern, 'i').test(text);
    } catch {
      return false;
    }
  });

  const response = matched?.recommendedResponse || pack.salesPitch;
  const keyboard =
    matched?.suggestedDocument === 'DATA_ROOM_NEXUS'
      ? dataroomFullKeyboard()
      : dataroomStep1Keyboard();

  await sendTelegramMessage(ctx.botToken, ctx.chatId, response, keyboard);

  recordEvent(ctx.projectId, 'HANDLED_OBJECTION', {
    category: matched?.objectionCategory || 'general'
  });

  await saveTelegramState(ctx.project.id, String(ctx.chatId), {
    salesState: advanceSalesState(state.salesState, 'NEGOTIATION'),
    lastAction: 'objection'
  });

  return response;
}

async function handleAppointment(ctx: BaseContext) {
  const reply = reunionMessage();
  await sendTelegramMessage(ctx.botToken, ctx.chatId, reply, reunionKeyboard());
  const state = await getTelegramState(ctx.project.id, String(ctx.chatId));
  await saveTelegramState(ctx.project.id, String(ctx.chatId), {
    salesState: advanceSalesState(state.salesState, 'QUALIFIED'),
    pendingInput: 'none',
    lastAction: 'reunion'
  });
  return reply;
}

type BotAction =
  | 'action_menu'
  | 'action_thesis'
  | 'action_phases'
  | 'action_dataroom'
  | 'action_dataroom_dossier'
  | 'action_dataroom_full'
  | 'action_buy'
  | 'action_buy_web3'
  | 'action_buy_spei'
  | 'action_reunion'
  | 'action_reunion_start'
  | 'action_reunion_email'
  | 'action_position';

const SLASH_ACTION_MAP: Record<string, BotAction> = {
  '/tesis': 'action_thesis',
  '/fases': 'action_phases',
  '/precios': 'action_phases',
  '/dataroom': 'action_dataroom',
  '/comprar': 'action_buy',
  '/adquirir': 'action_buy',
  '/reunion': 'action_reunion',
  '/posicion': 'action_position'
};

/**
 * Executes a bot action. Shared by inline callbacks and slash commands so both
 * entry points behave identically.
 */
export async function runAction(action: BotAction, ctx: BaseContext, state: TelegramLeadState): Promise<string | undefined> {
  const { projectId, project, metadata, botToken, chatId } = ctx;
  const pack = KnowledgePackLoader.getPack(projectId, metadata);
  const price = pack.publicKnowledge.pricingDetails?.tokenPriceUsd ?? 50;
  let replyText: string | undefined;

  switch (action) {
    case 'action_menu': {
      await sendMainMenu(ctx);
      break;
    }

    case 'action_thesis': {
      replyText = thesisMessage(pack);
      await sendTelegramMessage(botToken, chatId, replyText, thesisKeyboard());
      recordEvent(projectId, 'VIEWED_PHASE');
      await saveTelegramState(project.id, String(chatId), {
        journeyStageId: 'stage_qualification_objections',
        lastAction: 'thesis'
      });
      break;
    }

    case 'action_phases': {
      const live = await getLivePhaseData(project);
      replyText = phasesMessage(live, pack);
      const session = HermesCommerceEngine.createCheckoutSession({
        leadId: String(chatId),
        projectSlug: projectId,
        tokenPriceUsd: price,
        paymentMethod: 'WEB3_USDC'
      });
      await sendTelegramMessage(
        botToken,
        chatId,
        replyText,
        phasesKeyboard({ checkoutUrl: session.checkoutUrl })
      );
      recordEvent(projectId, 'VIEWED_PHASE', {
        activePhase: live.activePhase?.name || null,
        phaseCount: live.phases.length
      });
      await saveTelegramState(project.id, String(chatId), {
        lastAction: 'phases'
      });
      break;
    }

    case 'action_dataroom': {
      replyText = dataroomStep1Message();
      await sendTelegramMessage(botToken, chatId, replyText, dataroomStep1Keyboard());
      break;
    }

    case 'action_dataroom_dossier': {
      replyText = dataroomDossierMessage(pack);
      await sendTelegramMessage(botToken, chatId, replyText, dataroomFullKeyboard());
      recordEvent(projectId, 'DOWNLOADED_DOSSIER');
      await saveTelegramState(project.id, String(chatId), {
        lastAction: 'dossier'
      });
      break;
    }

    case 'action_dataroom_full': {
      replyText =
        '🏛️ *Data Room Institucional*\n\nAquí encontrarás la documentación completa y auditada del proyecto: estructura legal, tokenización, estados financieros y gobernanza.';
      await sendTelegramMessage(botToken, chatId, replyText, dataroomFullKeyboard());
      await saveTelegramState(project.id, String(chatId), {
        lastAction: 'dataroom'
      });
      break;
    }

    case 'action_buy': {
      replyText = await handleBuy(ctx, state);
      break;
    }

    case 'action_buy_web3': {
      replyText = buyWeb3Message();
      const checkoutUrl = buildCheckoutUrl({ ref: state.referralCode });
      await sendTelegramMessage(botToken, chatId, replyText, buyWeb3Keyboard({ checkoutUrl }));
      recordEvent(projectId, 'INITIATED_CHECKOUT', { method: 'web3', referralCode: state.referralCode });
      await saveTelegramState(project.id, String(chatId), {
        salesState: advanceSalesState(state.salesState, 'READY'),
        lastAction: 'buy_web3'
      });
      break;
    }

    case 'action_buy_spei': {
      replyText = buySpeiMessage();
      const checkoutUrl = buildCheckoutUrl({ ref: state.referralCode });
      await sendTelegramMessage(botToken, chatId, replyText, buySpeiKeyboard({ checkoutUrl }));
      recordEvent(projectId, 'FASTLANE_RESERVATION', { method: 'spei', referralCode: state.referralCode });
      await saveTelegramState(project.id, String(chatId), {
        salesState: advanceSalesState(state.salesState, 'READY'),
        lastAction: 'buy_spei'
      });
      break;
    }

    case 'action_reunion': {
      replyText = reunionMessage();
      await sendTelegramMessage(botToken, chatId, replyText, reunionKeyboard());
      break;
    }

    case 'action_reunion_start': {
      replyText = await handleAppointment(ctx);
      break;
    }

    case 'action_reunion_email': {
      if (state.email) {
        replyText = reunionRegisteredMessage(state.email);
        await sendTelegramMessage(botToken, chatId, replyText, positionKeyboard());
      } else {
        replyText = await handleAppointment(ctx);
      }
      break;
    }

    case 'action_position': {
      replyText = positionMessage();
      await sendTelegramMessage(botToken, chatId, replyText, positionKeyboard());
      break;
    }

    default: {
      await sendMainMenu(ctx);
      break;
    }
  }

  return replyText;
}

export async function handleTelegramMessage(params: {
  projectId: string;
  project: any;
  metadata: any;
  botToken: string;
  chatId: number;
  text: string;
  firstName?: string;
}): Promise<TelegramBotResult> {
  const { projectId, project, metadata, botToken, chatId, text, firstName } = params;
  const ctx: BaseContext = { projectId, project, metadata, botToken, chatId };

  const trimmed = text.trim();

  // 1. Human handoff pause: do not auto-reply while a human is handling.
  if (await HumanHandoffProtocol.isPaused(project.id, String(chatId))) {
    return { handled: true, paused: true };
  }

  const state = await getTelegramState(project.id, String(chatId));

  // 2. /start & /menu → welcome + main menu with referral parameter extraction
  if (trimmed.startsWith('/start') || trimmed === '/menu' || trimmed === '/inicio') {
    let extractedRef: string | undefined = undefined;
    if (trimmed.startsWith('/start ')) {
      const param = trimmed.replace('/start ', '').trim();
      if (param.startsWith('ref_')) {
        extractedRef = param.replace('ref_', '').trim();
      } else if (param) {
        extractedRef = param;
      }
    }

    const refToSave = extractedRef || state.referralCode;

    await saveTelegramState(project.id, String(chatId), {
      salesState: advanceSalesState(state.salesState, 'CONTACTED'),
      journeyStageId: 'stage_welcome_thesis',
      pendingInput: 'none',
      ...(refToSave ? { referralCode: refToSave } : {}),
      lastAction: 'start'
    });
    await sendMainMenu(ctx, firstName);
    return { handled: true, replyText: welcomeMessage(firstName) };
  }

  // 2b. Slash commands → same actions as inline buttons
  const slashAction = SLASH_ACTION_MAP[trimmed.toLowerCase()];
  if (slashAction) {
    const replyText = await runAction(slashAction, ctx, state);
    return { handled: true, replyText };
  }

  // 3. Pending input capture (email for founder meeting)
  if (state.pendingInput === 'email') {
    if (!isValidEmail(trimmed)) {
      await sendTelegramMessage(
        botToken,
        chatId,
        'Ese correo no parece válido. Escríbelo en formato nombre@dominio.com para continuar.'
      );
      return { handled: true };
    }

    const { journey, objectiveState } = HermesJourneyEngine.evaluateJourney(
      'family_referral_journey',
      state.journeyStageId,
      { email: trimmed, ...(state.phone ? { phone: state.phone } : {}) }
    );
    void journey;

    await saveTelegramState(project.id, String(chatId), {
      email: trimmed,
      pendingInput: 'none',
      journeyStageId: objectiveState.currentStageId || 'stage_founder_meeting',
      salesState: advanceSalesState(state.salesState, 'QUALIFIED'),
      lastAction: 'email_captured'
    });

    const confirm = reunionRegisteredMessage(trimmed);
    await sendTelegramMessage(botToken, chatId, confirm, positionKeyboard());
    return { handled: true, replyText: confirm };
  }

  // 4. Intent classification via Hermes Interaction Router
  const route: RouteResult = InteractionRouter.route(trimmed, { salesState: state.salesState });

  switch (route.intent) {
    case 'HUMAN_ESCALATION': {
      await HumanHandoffProtocol.triggerHandoff({
        projectId: project.id,
        chatId: String(chatId),
        reason: route.reason,
        lastUserMessage: trimmed
      });
      const reply =
        '🆘 Entendido. Un asesor humano de los fundadores tomará tu caso y te contactará a la brevedad. Si prefieres seguir explorando, aquí estoy.';
      await sendTelegramMessage(botToken, chatId, reply, mainMenuKeyboard());
      return { handled: true, replyText: reply };
    }

    case 'APPOINTMENT_REQUEST': {
      const reply = await handleAppointment(ctx);
      return { handled: true, replyText: reply };
    }

    case 'OBJECTION': {
      const reply = await handleObjection(ctx, state, trimmed);
      return { handled: true, replyText: reply };
    }

    case 'SALES_INQUIRY': {
      const reply = await handleBuy(ctx, state);
      return { handled: true, replyText: reply };
    }

    case 'SUPPORT_FAQ':
    case 'GENERAL_CHAT':
    default: {
      // Fall through to LLM engine for free-form conversation
      return { handled: false };
    }
  }
}

export async function handleTelegramCallback(params: {
  projectId: string;
  project: any;
  metadata: any;
  botToken: string;
  callbackQueryId: string;
  chatId: number;
  data: string;
}): Promise<TelegramBotResult> {
  const { projectId, project, metadata, botToken, callbackQueryId, chatId, data } = params;
  const ctx: BaseContext = { projectId, project, metadata, botToken, chatId };

  await answerCallbackQuery(botToken, callbackQueryId, 'Un momento…');

  const state = await getTelegramState(project.id, String(chatId));

  const action = data as BotAction;
  const replyText = await runAction(action, ctx, state);

  return { handled: true, replyText };
}

export { buildCheckoutUrl };
