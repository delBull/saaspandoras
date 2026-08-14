import { NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { DefaultPlatformEventBus } from '@/lib/pandoras/core/platform/events/default-event-bus';
import { OperationalIntent } from '@/lib/pandoras/core/contracts/governance-contracts';
import {
  HermesOnboardingWorkflow,
  OnboardingStage,
} from '@/lib/pandoras/core/domains/hermes/onboarding-workflow';
import { db } from '@/db';
import { portalOnboardingState } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { DefaultOmnichannelGateway } from '@/lib/pandoras/core/domains/channels/omnichannel-gateway';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';
import { getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { RuntimeMessage } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';

const eventBus = new DefaultPlatformEventBus();
const omnichannelGateway = new DefaultOmnichannelGateway();

export interface PortalChatMessage {
  id: string;
  role: 'hermes' | 'user';
  content: string;
  timestamp: string;
  chips?: string[];
}

interface OrganizationOnboardingState {
  stage: OnboardingStage;
  messages: PortalChatMessage[];
}

interface StageReply {
  nextStage: OnboardingStage;
  intentType: string;
  objective: string;
  replyText: string;
}

const STAGE_REPLIES: Record<OnboardingStage, StageReply> = {
  BUSINESS_DISCOVERY: {
    nextStage: 'IDENTITY_CONFIGURATION',
    intentType: 'UPDATE_IDENTITY',
    objective: 'Set business domain and focus',
    replyText: 'Entendido. He registrado la actividad principal de {orgName}. Ahora configuremos la Identidad Operativa de Hermes: ¿Cuál es el tono de voz principal con el que debe dirigirse a tus clientes?'
  },
  IDENTITY_CONFIGURATION: {
    nextStage: 'KNOWLEDGE_GATHERING',
    intentType: 'UPDATE_IDENTITY',
    objective: 'Set Hermes voice and tone profile',
    replyText: 'Excelente, la identidad de voz está configurada. El siguiente paso es la Base de Conocimiento (KNOW). ¿Qué tipo de información o documentos principales usará Hermes para responder a tus clientes?'
  },
  KNOWLEDGE_GATHERING: {
    nextStage: 'POLICY_DEFINITION',
    intentType: 'CREATE_KNOWLEDGE_SOURCE',
    objective: 'Register knowledge source requirements',
    replyText: 'Perfecto, he tomado nota de la estructura de conocimiento. Ahora definamos las Políticas de Gobernanza: ¿Existe alguna regla o límite estricto para las respuestas de Hermes?'
  },
  POLICY_DEFINITION: {
    nextStage: 'CHANNEL_SETUP',
    intentType: 'UPDATE_POLICY_PACK',
    objective: 'Enforce operational governance constraints',
    replyText: 'Políticas de gobernanza registradas y activas. El paso final de la preparación es conectar el canal por donde Hermes atenderá clientes.'
  },
  CHANNEL_SETUP: {
    nextStage: 'ACTIVATION',
    intentType: 'CONFIGURE_CHANNEL_BINDING',
    objective: 'Complete onboarding sequence',
    replyText: '¡Excelente! Hermes ha completado la secuencia de onboarding inicial. Tu proyecto ya tiene estructura de Identidad, Conocimiento y Gobernanza activas.'
  },
  ACTIVATION: {
    nextStage: 'ACTIVATION',
    intentType: 'EXECUTE_QUERY',
    objective: 'Ongoing customer operations',
    replyText: 'He recibido tu mensaje. Estoy monitoreando las operaciones de {orgName}. ¿Hay alguna consulta o ajuste específico que quieras realizar?'
  }
};

function getStageChips(stage: OnboardingStage): string[] {
  switch (stage) {
    case 'BUSINESS_DISCOVERY':
      return [
        '🏠 Inmobiliaria & Desarrollo',
        '💼 Servicios B2B & Consultoría',
        '💰 Fondo de Inversión',
        '🛍 Comercio & E-Commerce'
      ];
    case 'IDENTITY_CONFIGURATION':
      return [
        '👔 Profesional & Formal',
        '🤝 Cercano & Asesor',
        '⚡ Directo & Comercial'
      ];
    case 'KNOWLEDGE_GATHERING':
      return [
        '📄 Subir Documentos (KNOW)',
        '🔗 Aprender de Sitio Web',
        '💬 Cargar FAQ de Clientes',
        '⚙ Enseñar Reglas de Negocio'
      ];
    case 'POLICY_DEFINITION':
      return [
        '🛡 No prometer retornos o garantías',
        '🔒 Requerir aprobación para descuentos',
        '📞 Derivar a un humano si hay dudas'
      ];
    case 'CHANNEL_SETUP':
      return [
        '📱 Conectar Telegram (Fase 6.5)',
        '🌐 Probar Widget del Portal'
      ];
    case 'ACTIVATION':
    default:
      return [
        '🧠 Ir a Hermes KNOW',
        '📊 Ver Estado del Sistema'
      ];
  }
}

// ---------------------------------------------------------------------------
// K12-A07: Conversation ≠ Knowledge ≠ Authority
// This mapper converts Portal chat history to RuntimeMessages.
// The resulting array is passed as conversationHistory — ephemeral context only.
// It NEVER grants authority, creates ACTIVE knowledge, or overrides governance.
// ---------------------------------------------------------------------------
function toRuntimeMessages(msgs: PortalChatMessage[]): RuntimeMessage[] {
  return msgs.map(m => ({
    id: m.id,
    role: m.role === 'hermes' ? 'ASSISTANT' as const : 'USER' as const,
    content: m.content,
    createdAt: new Date(m.timestamp),
  }));
}

function getInitialState(orgName: string): OrganizationOnboardingState {
  const initialStage: OnboardingStage = 'BUSINESS_DISCOVERY';
  const initialChips = getStageChips(initialStage);
  return {
    stage: initialStage,
    messages: [
      {
        id: 'welcome-1',
        role: 'hermes',
        content: `Hola. Todavía no conozco los detalles de ${orgName}. Antes de conectar canales y definir políticas, necesito entender qué hace tu organización y qué tipo de clientes quieres atender. ¿Podrías describirme brevemente tu negocio?`,
        timestamp: new Date().toISOString(),
        chips: initialChips
      }
    ]
  };
}

async function loadOrCreateState(tenantId: string, orgName: string): Promise<OrganizationOnboardingState> {
  const rows = await db
    .select()
    .from(portalOnboardingState)
    .where(eq(portalOnboardingState.tenantId, tenantId))
    .limit(1);

  const existing = rows[0];
  if (existing) {
    return {
      stage: existing.stage as OnboardingStage,
      messages: (existing.messages ?? []) as PortalChatMessage[]
    };
  }

  const initialState = getInitialState(orgName);
  await db.insert(portalOnboardingState).values({
    tenantId,
    stage: initialState.stage,
    messages: initialState.messages as unknown as object
  });
  return initialState;
}

async function saveState(tenantId: string, state: OrganizationOnboardingState): Promise<void> {
  await db
    .insert(portalOnboardingState)
    .values({
      tenantId,
      stage: state.stage,
      messages: state.messages as unknown as object
    })
    .onConflictDoUpdate({
      target: portalOnboardingState.tenantId,
      set: {
        stage: state.stage,
        messages: state.messages as unknown as object,
        updatedAt: new Date()
      }
    });
}

export async function GET(request: Request) {
  try {
    if (process.env.HERMES_ENABLED === 'false') {
      return NextResponse.json({ error: 'Hermes is currently disabled' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const organizationSlug = searchParams.get('organizationSlug');

    if (!organizationSlug) {
      return NextResponse.json({ error: 'Missing organizationSlug' }, { status: 400 });
    }

    const context = await resolvePortalContext(organizationSlug);
    const tenantId = context.organization.slug;
    const orgName = context.organization.name || organizationSlug;

    const state = await loadOrCreateState(tenantId, orgName);

    return NextResponse.json({
      success: true,
      stage: state.stage,
      messages: state.messages,
      chips: getStageChips(state.stage)
    });
  } catch (error: any) {
    console.error('[Portal Messages GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (process.env.HERMES_ENABLED === 'false') {
      return NextResponse.json({ error: 'Hermes is currently disabled' }, { status: 503 });
    }

    const body = await request.json();
    const { organizationSlug, content, clientMessageId } = body;

    if (!organizationSlug || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // LOCK 6.5.1-A & H3: Authenticate & resolve authorized ControlPlaneContext (NEVER trust payload body for tenantId)
    const context = await resolvePortalContext(organizationSlug);
    const tenantId = context.organization.slug;
    const orgName = context.organization.name || organizationSlug;

    const cpCtx = new ControlPlaneContext(
      context.tenant.sessionId,
      context.tenant.actorId,
      context.tenant.role as any,
      context.tenant.permissions as any,
      [{ organizationId: context.tenant.organizationId, role: context.tenant.role as any }]
    );

    // LOCK 6.5.1-A: Delegate Inbound transport through PortalAdapter & OmnichannelGateway
    const normalizedInbound = await omnichannelGateway.receive({
      channelType: 'portal',
      externalId: clientMessageId || `msg_${Date.now()}`,
      rawPayload: {
        content,
        clientMessageId
      }
    }, cpCtx);

    const state = await loadOrCreateState(tenantId, orgName);
    const currentStage = state.stage;

    // 1. Record User Message
    const userMsg: PortalChatMessage = {
      id: normalizedInbound.message.externalMessageId,
      role: 'user',
      content: normalizedInbound.message.content,
      timestamp: normalizedInbound.receivedAt.toISOString()
    };
    state.messages.push(userMsg);

    // 2. Advance Onboarding State Machine (source of truth: HermesOnboardingWorkflow.transitions)
    const workflowTransitions = HermesOnboardingWorkflow.transitions?.[currentStage] ?? [];
    const transitionTarget = workflowTransitions[0] ?? currentStage;
    const reply = STAGE_REPLIES[currentStage];
    const nextStage: OnboardingStage = transitionTarget as OnboardingStage;

    const intent: OperationalIntent = {
      id: `intent_${Date.now()}`,
      organizationId: tenantId,
      missionId: 'hermes.onboarding.v1',
      packId: 'core',
      packVersion: '1.0',
      strategyDecisionId: `sd_${Date.now()}`,
      objective: reply.objective,
      intentType: reply.intentType,
      rationale: `User provided context via Hermes onboarding during ${currentStage}`,
      constraints: [],
      approvalPolicy: { required: false },
      approvals: [],
      status: 'pending_approval',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    eventBus.publish({
      id: crypto.randomUUID(),
      type: 'OPERATIONAL_INTENT_CREATED',
      timestamp: new Date(),
      instanceId: tenantId,
      correlationId: normalizedInbound.correlationId,
      payload: intent
    } as any);

    // 3. Advance stage & build Hermes reply
    let replyText = reply.replyText.replace('{orgName}', orgName);
    let stageChips = getStageChips(nextStage);

    if (currentStage === 'ACTIVATION') {
      // -------------------------------------------------------------------------
      // K12-A04 — Runtime Entry Boundary
      // In ACTIVATION stage, all cognitive responses must pass through HermesRuntime.
      // The HTTP handler does NOT reason, does NOT build prompts, does NOT call
      // CognitiveContextBuilder directly.
      //
      // K12-A07 — Conversation ≠ Knowledge
      // The conversation history is passed as ephemeral context only.
      // It does NOT grant authority or modify ACTIVE knowledge.
      //
      // K12-A08 — suggestedActions from Runtime (never fabricated by UI)
      // -------------------------------------------------------------------------
      const runtime = getDefaultRuntime();

      const currentMsg: RuntimeMessage = {
        id: userMsg.id,
        role: 'USER',
        content: userMsg.content,
        createdAt: new Date(userMsg.timestamp),
      };

      // K12-A07: history as input, never as authority
      // (Migrated to HermesRuntime memory provider in 6.12.5)
      
      const runtimeResponse = await runtime.respond({
        organizationId: tenantId,
        conversationId: `portal_${tenantId}`,
        message: currentMsg,
        // K12-A05: tenantId derived from resolvePortalContext — never trusted from client payload.
        // Bridge to the ControlPlaneContext interface expected by HermesRuntime (knowledge/types.ts).
        controlPlaneContext: {
          actorId: context.tenant.actorId,
          organizationId: context.tenant.organizationId,
          role: context.tenant.role as any,
          permissions: context.tenant.permissions as any,
          sessionId: context.tenant.sessionId,
        }
      });

      replyText = runtimeResponse.content;
      // K12-A08: chips come from the Runtime, never fabricated by the Portal
      stageChips = runtimeResponse.suggestedActions.length > 0
        ? runtimeResponse.suggestedActions
        : getStageChips('ACTIVATION');
    }

    const hermesMsg: PortalChatMessage = {
      id: `hermes_${Date.now()}`,
      role: 'hermes',
      content: replyText,
      timestamp: new Date().toISOString(),
      chips: stageChips
    };
    state.messages.push(hermesMsg);
    state.stage = nextStage;

    await saveState(tenantId, state);

    return NextResponse.json({
      success: true,
      stage: state.stage,
      reply: replyText,
      chips: getStageChips(state.stage),
      messages: state.messages,
      correlationId: normalizedInbound.correlationId
    });

  } catch (error: any) {
    console.error('[Portal Messages POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
