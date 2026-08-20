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
import { HermesOnboardingOrchestrator } from '@/lib/pandoras/core/domains/hermes/onboarding/orchestrator';

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

// Stage replies are now handled dynamically by HermesOnboardingOrchestrator.

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

function getInitialState(orgName: string, orgSlug: string): OrganizationOnboardingState {
  const isKnownOrg = orgSlug === 'snarai' || orgName.toLowerCase().includes('narai');
  
  const initialStage: OnboardingStage = isKnownOrg ? 'ACTIVATION' : 'BUSINESS_DISCOVERY';
  
  const initialChips = getStageChips(initialStage);
    
  const initialContent = isKnownOrg 
    ? `Hola. Conozco perfectamente los detalles de ${orgName} y su modelo de Fractional Real Estate. ¿En qué puedo ayudarte hoy para optimizar la conversión de S'Narai?`
    : `Hola. Todavía no conozco los detalles de ${orgName}. Antes de conectar canales y definir políticas, necesito entender qué hace tu organización y qué tipo de clientes quieres atender. ¿Podrías describirme brevemente tu negocio?`;

  return {
    stage: initialStage,
    messages: [
      {
        id: 'welcome-1',
        role: 'hermes',
        content: initialContent,
        timestamp: new Date().toISOString(),
        chips: initialChips
      }
    ]
  };
}

async function loadOrCreateState(tenantId: string, orgName: string, orgSlug: string): Promise<OrganizationOnboardingState> {
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

  const initialState = getInitialState(orgName, orgSlug);
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

    const state = await loadOrCreateState(tenantId, orgName, organizationSlug);

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

    const state = await loadOrCreateState(tenantId, orgName, organizationSlug);
    const currentStage = state.stage;

    // 1. Record User Message
    const userMsg: PortalChatMessage = {
      id: normalizedInbound.message.externalMessageId,
      role: 'user',
      content: normalizedInbound.message.content,
      timestamp: normalizedInbound.receivedAt.toISOString()
    };
    state.messages.push(userMsg);

    // Delegate processing to HermesOnboardingOrchestrator
    const orchestrator = new HermesOnboardingOrchestrator();
    const currentMsg: RuntimeMessage = {
      id: userMsg.id,
      role: 'USER',
      content: userMsg.content,
      createdAt: new Date(userMsg.timestamp),
    };

    const orchestratorResult = await orchestrator.processTurn(
      tenantId,
      currentStage,
      currentMsg,
      {
        actorId: context.tenant.actorId,
        organizationId: context.tenant.organizationId,
        role: context.tenant.role as any,
        permissions: context.tenant.permissions as any,
        sessionId: context.tenant.sessionId,
      }
    );

    const hermesMsg: PortalChatMessage = {
      id: `hermes_${Date.now()}`,
      role: 'hermes',
      content: orchestratorResult.replyText,
      timestamp: new Date().toISOString(),
      chips: orchestratorResult.chips
    };
    state.messages.push(hermesMsg);
    state.stage = orchestratorResult.nextStage;

    await saveState(tenantId, state);

    return NextResponse.json({
      success: true,
      stage: state.stage,
      reply: orchestratorResult.replyText,
      chips: orchestratorResult.chips,
      messages: state.messages,
      correlationId: normalizedInbound.correlationId
    });

  } catch (error: any) {
    console.error('[Portal Messages POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
