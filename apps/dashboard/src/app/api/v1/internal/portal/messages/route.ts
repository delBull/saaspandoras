import { NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { db } from '@/db';
import { hermesConversationMessages, portalOnboardingState } from '@/db/schema';
import { eq, and, or, asc } from 'drizzle-orm';
import { OnboardingStage } from '@/lib/pandoras/core/domains/hermes/onboarding-workflow';
import { DefaultOmnichannelGateway } from '@/lib/pandoras/core/domains/channels/omnichannel-gateway';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';
import { HermesOnboardingOrchestrator } from '@/lib/pandoras/core/domains/hermes/onboarding/orchestrator';
import { RuntimeMessage } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';

const omnichannelGateway = new DefaultOmnichannelGateway();

interface PortalChatMessage {
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

function getTopicChips(topicId: string, orgName: string, orgSlug?: string): string[] {
  const isKnownSnarai = orgSlug === 'snarai' || orgName.toLowerCase().includes('narai');

  switch (topicId) {
    case 'marketing':
      return isKnownSnarai ? [
        '🚀 Plan de Lanzamiento Founder',
        '💎 Propuesta de Valor ($50 USD)',
        '🎯 Segmentación Inversionistas VIP',
        '📊 Campaña Meta & Funnels'
      ] : [
        `🚀 Plan de Crecimiento ${orgName}`,
        '💎 Propuesta de Valor',
        '🎯 Segmentación de Audiencia',
        '📊 Campañas y Canales'
      ];
    case 'tokenomics':
      return isKnownSnarai ? [
        '📜 Estructura de CPs y Fideicomiso',
        '🏖️ Noches de Estancia por Nivel',
        '💰 Distribución Pro-Rata USDC',
        '🛡️ Respaldo RWA en Bucerías'
      ] : [
        `📜 Estructura de Activos — ${orgName}`,
        '💰 Modelo de Rendimiento y Utilidad',
        '🛡️ Respaldo y Custodia',
        '⚖️ Reglas de Gobernanza'
      ];
    case 'journeys':
      return [
        '🚨 Reglas de Escalación Humana',
        '📋 Cualificación de Prospectos',
        '📱 Flujo WhatsApp Concierge',
        '💬 Asistente Telegram'
      ];
    case 'general':
    default:
      return [
        '📊 Resumen de Rendimiento',
        '💎 Diagnóstico de Bóveda',
        '🤖 Configurar Nuevo Journey',
        '🔧 Políticas Institucionales'
      ];
  }
}

function getTopicInitialMessage(topicId: string, orgName: string, orgSlug: string): PortalChatMessage {
  const isKnownSnarai = orgSlug === 'snarai' || orgName.toLowerCase().includes('narai');
  const now = new Date().toISOString();

  switch (topicId) {
    case 'marketing':
      return {
        id: `welcome_marketing_${Date.now()}`,
        role: 'hermes',
        content: isKnownSnarai
          ? `🎯 **Estrategia de Marketing & Lanzamiento — ${orgName}**\n\nConozco el dossier confidencial, el pool de capitalización de **$100M MXN** y las tres fases de certificados:\n\n1. 💎 **Fase Founder:** $50 USD / CP\n2. 📈 **Fase Estratégica:** $75 USD / CP\n3. 🏛️ **Fase General:** $100 USD / CP\n\n¿Qué aspecto de la campaña, embudo o segmentación de inversionistas deseas estructurar hoy?`
          : `🎯 **Estrategia de Marketing & Crecimiento — ${orgName}**\n\nEstoy listo para calibrar tus canales de adquisición, copies publicitarios y embudos de prospección institucionales para **${orgName}**.\n\n¿Qué objetivo de marketing o campaña deseas trabajar hoy?`,
        timestamp: now,
        chips: getTopicChips('marketing', orgName, orgSlug)
      };
    case 'tokenomics':
      return {
        id: `welcome_tokenomics_${Date.now()}`,
        role: 'hermes',
        content: isKnownSnarai
          ? `🏛️ **Estructura RWA & Certificados de Participación — ${orgName}**\n\nEste canal está enfocado en la ingeniería patrimonial de la **Zona Dorada de Bucerías**:\n\n- 💰 **5% Yield Operativo Pro-Rata en USDC**\n- 🏖️ **Derechos de Estancia:** Explorer ($500), Resident ($2,500), Ambassador ($10,000), Riviera Owner ($50,000)\n- 🛡️ **Fideicomiso Bancario Mexicano**\n\n¿Qué consulta tienes sobre el activo o los rendimientos?`
          : `🏛️ **Modelo de Negocio & Tokenomics — ${orgName}**\n\nEste canal analiza la estructura de capital, incentivos y economía de **${orgName}** según los contratos y la bóveda de conocimiento activa.\n\n¿Qué consulta tienes sobre el modelo o las reglas de distribución?`,
        timestamp: now,
        chips: getTopicChips('tokenomics', orgName, orgSlug)
      };
    case 'journeys':
      return {
        id: `welcome_journeys_${Date.now()}`,
        role: 'hermes',
        content: `🤖 **Automatizaciones & Embudo de Prospección — ${orgName}**\n\nControl de flujos conversacionales multicanal para **${orgName}**:\n\n- 📞 **Cualificación de Leads en WhatsApp y Telegram**\n- 🚨 **Escalación Humana Inmediata**\n- 📅 **Agendamiento y Cierre Asistido**\n\n¿Qué flujo deseas calibrar o activar?`,
        timestamp: now,
        chips: getTopicChips('journeys', orgName, orgSlug)
      };
    case 'general':
    default:
      const initialContent = isKnownSnarai 
        ? `Hola. Soy **Hermes**, tu Asesor Patrimonial y Growth Intelligence Officer para **${orgName}**.\n\nConozco a fondo el modelo de Fractional Real Estate, la bóveda de conocimiento y los canales conectados. ¿En qué objetivo estratégico nos enfocamos hoy?`
        : `Hola. Soy **Hermes**, el agente inteligente y sistema operativo de **${orgName}**.\n\nEstoy conectado a tu bóveda de conocimiento y canales activos. ¿En qué objetivo o consulta estratégica deseas enfocarte hoy?`;
      return {
        id: `welcome_general_${Date.now()}`,
        role: 'hermes',
        content: initialContent,
        timestamp: now,
        chips: getTopicChips('general', orgName, orgSlug)
      };
  }
}

async function loadOrCreateState(tenantId: string, orgName: string, orgSlug: string, orgId?: string): Promise<OrganizationOnboardingState> {
  try {
    const rows = await db
      .select()
      .from(portalOnboardingState)
      .where(
        or(
          eq(portalOnboardingState.tenantId, tenantId),
          eq(portalOnboardingState.tenantId, orgSlug),
          ...(orgId ? [eq(portalOnboardingState.tenantId, orgId)] : [])
        )
      )
      .limit(1);

    const existing = rows[0];
    if (existing) {
      return {
        stage: existing.stage as OnboardingStage,
        messages: (existing.messages ?? []) as PortalChatMessage[]
      };
    }
  } catch (err) {
    console.warn('[loadOrCreateState] query notice:', err);
  }

  const initial = getTopicInitialMessage('general', orgName, orgSlug);
  const initialState: OrganizationOnboardingState = {
    stage: 'BUSINESS_DISCOVERY',
    messages: [initial]
  };

  try {
    await db.insert(portalOnboardingState).values({
      tenantId,
      stage: initialState.stage,
      messages: initialState.messages as unknown as object
    });
  } catch (err) {
    console.warn('[loadOrCreateState] insert notice:', err);
  }
  return initialState;
}

async function saveState(tenantId: string, state: OrganizationOnboardingState): Promise<void> {
  try {
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
  } catch (err) {
    console.warn('[saveState] update notice:', err);
  }
}

export async function GET(request: Request) {
  try {
    if (process.env.HERMES_ENABLED === 'false') {
      return NextResponse.json({ error: 'Hermes is currently disabled' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const organizationSlug = searchParams.get('organizationSlug');
    const topicId = searchParams.get('topicId') || 'general';

    if (!organizationSlug) {
      return NextResponse.json({ error: 'Missing organizationSlug' }, { status: 400 });
    }

    const context = await resolvePortalContext(organizationSlug);
    const tenantSlug = context.tenant.organizationSlug || context.organization.slug || organizationSlug;
    const orgId = context.tenant.organizationId;
    const orgName = context.organization.name || organizationSlug;
    const conversationId = `portal_${tenantSlug}_${topicId}`;

    // 0. Fetch actual onboarding stage from portalOnboardingState
    let currentStage: OnboardingStage = 'BUSINESS_DISCOVERY';
    try {
      const onboardingRows = await db
        .select({ stage: portalOnboardingState.stage })
        .from(portalOnboardingState)
        .where(
          or(
            eq(portalOnboardingState.tenantId, tenantSlug),
            eq(portalOnboardingState.tenantId, orgId),
            eq(portalOnboardingState.tenantId, organizationSlug),
            eq(portalOnboardingState.tenantId, String(context.organization.projectId))
          )
        )
        .limit(1);

      if (onboardingRows[0]?.stage) {
        currentStage = onboardingRows[0].stage as OnboardingStage;
      }
    } catch (err) {
      console.warn('[Portal Messages GET] onboardingRows fallback:', err);
    }

    const isKnownSnarai = tenantSlug === 'snarai' || orgName.toLowerCase().includes('narai');

    // 1. Fetch persisted messages from hermesConversationMessages
    let dbMessages: any[] = [];
    try {
      dbMessages = await db
        .select()
        .from(hermesConversationMessages)
        .where(
          and(
            or(
              eq(hermesConversationMessages.organizationId, tenantSlug),
              eq(hermesConversationMessages.organizationId, orgId),
              ...(isKnownSnarai ? [eq(hermesConversationMessages.organizationId, 'snarai')] : [])
            ),
            or(
              eq(hermesConversationMessages.conversationId, conversationId),
              eq(hermesConversationMessages.conversationId, `portal_${orgId}_${topicId}`),
              ...(topicId === 'general' ? [eq(hermesConversationMessages.conversationId, `portal_${orgId}`)] : [])
            )
          )
        )
        .orderBy(asc(hermesConversationMessages.sequence));
    } catch (err) {
      console.warn('[Portal Messages GET] dbMessages fallback:', err);
    }

    if (dbMessages.length > 0) {
      const mappedMessages: PortalChatMessage[] = dbMessages.map(m => ({
        id: m.id,
        role: m.role === 'ASSISTANT' ? 'hermes' : 'user',
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        topicId,
        stage: currentStage,
        messages: mappedMessages,
        chips: getTopicChips(topicId, orgName, tenantSlug)
      });
    }

    // 2. Return tailored initial state if no messages exist yet
    const topicInitial = getTopicInitialMessage(topicId, orgName, tenantSlug);
    return NextResponse.json({
      success: true,
      topicId,
      stage: currentStage,
      messages: [topicInitial],
      chips: getTopicChips(topicId, orgName, tenantSlug)
    });
  } catch (error: any) {
    console.error('[Portal Messages GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationSlug = searchParams.get('organizationSlug');
    const topicId = searchParams.get('topicId') || 'general';

    if (!organizationSlug) {
      return NextResponse.json({ error: 'Missing organizationSlug' }, { status: 400 });
    }

    const context = await resolvePortalContext(organizationSlug);
    const tenantSlug = context.tenant.organizationSlug || context.organization.slug || organizationSlug;
    const orgId = context.tenant.organizationId;
    const conversationId = `portal_${tenantSlug}_${topicId}`;

    await db
      .delete(hermesConversationMessages)
      .where(
        and(
          or(
            eq(hermesConversationMessages.organizationId, tenantSlug),
            eq(hermesConversationMessages.organizationId, orgId),
            eq(hermesConversationMessages.organizationId, 'snarai')
          ),
          or(
            eq(hermesConversationMessages.conversationId, conversationId),
            eq(hermesConversationMessages.conversationId, `portal_${orgId}_${topicId}`),
            ...(topicId === 'general' ? [eq(hermesConversationMessages.conversationId, `portal_${orgId}`)] : [])
          )
        )
      );

    return NextResponse.json({ success: true, message: `Historial de ${topicId} limpiado` });
  } catch (error: any) {
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

    const normalizedInbound = await omnichannelGateway.receive({
      channelType: 'portal',
      externalId: clientMessageId || `msg_${Date.now()}`,
      rawPayload: {
        content,
        clientMessageId
      }
    }, cpCtx);

    const state = await loadOrCreateState(tenantId, orgName, organizationSlug, context.tenant.organizationId);
    const currentStage = state.stage;

    const userMsg: PortalChatMessage = {
      id: normalizedInbound.message.externalMessageId,
      role: 'user',
      content: normalizedInbound.message.content,
      timestamp: normalizedInbound.receivedAt.toISOString()
    };
    state.messages.push(userMsg);

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
