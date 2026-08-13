import { NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { DefaultPlatformEventBus } from '@/lib/pandoras/core/platform/events/default-event-bus';
import { OperationalIntent } from '@/lib/pandoras/core/contracts/governance-contracts';

// Placeholder for the real global event bus in a production environment
const eventBus = new DefaultPlatformEventBus();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationSlug, content } = body;

    if (!organizationSlug || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Resolve context to ensure the user has access to this organization
    const context = await resolvePortalContext(organizationSlug);

    // 2. Publish an inbound message event to the Event Spine
    // "Portal conversation uses the same Hermes Runtime as external channels."
    const inboundEvent = {
      id: crypto.randomUUID(),
      type: 'PORTAL_MESSAGE_RECEIVED',
      timestamp: new Date(),
      instanceId: context.tenant.organizationId,
      correlationId: context.tenant.sessionId,
      payload: {
        actorId: context.tenant.actorId,
        content: content,
        channel: 'PORTAL'
      }
    };

    eventBus.publish(inboundEvent as any);

    // 3. For Phase 6.3 Onboarding Journey simulation, we intercept specific content
    // to advance the HERMES_ONBOARDING journey.
    // In a real flow, the Cognitive Engine (Hermes) would process the event and yield an OperationalIntent.

    let reply = "I am processing your input...";

    if (content.toLowerCase().includes('inmobiliaria') || content.toLowerCase().includes('real estate') || content.toLowerCase().includes('eld')) {
      // Simulate Hermes proposing an Identity Update Intent
      const intent: OperationalIntent = {
        id: `intent_${Date.now()}`,
        organizationId: context.tenant.organizationId,
        missionId: 'hermes.onboarding.v1',
        packId: 'core',
        packVersion: '1.0',
        strategyDecisionId: `sd_${Date.now()}`,
        objective: 'Update business identity',
        intentType: 'UPDATE_IDENTITY',
        rationale: 'User provided new business context via Hermes',
        constraints: [],
        approvalPolicy: { required: false },
        approvals: [],
        status: 'pending_approval',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('[Hermes Intelligence] Proposed Intent:', intent);
      reply = "Entendido. He registrado que tu negocio es del rubro inmobiliario. Esto actualiza tu Perfil de Identidad. El siguiente paso es configurar tu Base de Conocimiento. ¿Qué tipo de documentos o fuentes de información utilizas para ventas?";
      
      // Emit the intent to the governance bus (mocked here)
      eventBus.publish({
        id: crypto.randomUUID(),
        type: 'OPERATIONAL_INTENT_CREATED',
        timestamp: new Date(),
        instanceId: context.tenant.organizationId,
        correlationId: context.tenant.sessionId,
        payload: intent
      } as any);
    } else if (content.toLowerCase().includes('documento') || content.toLowerCase().includes('pdf') || content.toLowerCase().includes('fuentes')) {
      reply = "Excelente, he tomado nota de tus fuentes de conocimiento. El siguiente paso es definir tus Políticas. ¿Hay alguna regla estricta que deba seguir al hablar con clientes?";
    } else if (content.toLowerCase().includes('regla') || content.toLowerCase().includes('política') || content.toLowerCase().includes('siempre')) {
      reply = "Políticas registradas. Finalmente, vamos a configurar los Canales. Puedes conectar Telegram o WhatsApp ahora mismo desde la capa de operaciones.";
    }

    return NextResponse.json({ 
      success: true, 
      reply,
      status: 'DELIVERED_TO_SPINE' 
    });

  } catch (error: any) {
    console.error('[Portal Messages API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
