/**
 * 📡 Pandora's Platform OS — Hermes Event Bus
 * lib/hermes/event-bus.ts
 *
 * Decoupled event bus for system-wide notifications and async listeners.
 */

export type HermesEventType =
  | 'ConversationStarted'
  | 'LeadQualified'
  | 'AppointmentCreated'
  | 'PaymentGenerated'
  | 'KnowledgeUpdated'
  | 'CustomerEscalated'
  | 'PortalActivated';

export interface HermesEvent {
  id: string;
  type: HermesEventType;
  projectId: number;
  chatId: string;
  payload: Record<string, any>;
  timestamp: string;
}

type EventListener = (event: HermesEvent) => Promise<void> | void;

class HermesEventBusImpl {
  private listeners: Map<HermesEventType, EventListener[]> = new Map();

  on(type: HermesEventType, listener: EventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  async emit(type: HermesEventType, projectId: number, chatId: string, payload: Record<string, any> = {}) {
    const event: HermesEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      projectId,
      chatId,
      payload,
      timestamp: new Date().toISOString(),
    };

    console.info(`[HermesEventBus] Event Published: ${type} for Project ${projectId}`, payload);

    const handlers = this.listeners.get(type) || [];
    await Promise.all(
      handlers.map(h => {
        try {
          return Promise.resolve(h(event));
        } catch (e) {
          console.error(`[HermesEventBus] Error executing listener for ${type}:`, e);
        }
      })
    );
  }
}

export const HermesEventBus = new HermesEventBusImpl();

// ── Default Global System Listeners ──────────────────────────────────────────

// Log Escalations to Discord
HermesEventBus.on('CustomerEscalated', async (event) => {
  const discordWebhook = process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;
  if (!discordWebhook) return;

  await fetch(discordWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: '🚨 Evento: Cliente Escalado a Humano',
        color: 0xef4444,
        fields: [
          { name: 'Project ID', value: String(event.projectId), inline: true },
          { name: 'Chat ID', value: event.chatId, inline: true },
          { name: 'Razón', value: event.payload.reason || 'Escalación automática', inline: false },
        ],
        timestamp: event.timestamp
      }]
    })
  }).catch(e => console.error('[EventBus Discord Error]:', e));
});

// Dispatch Human Escalation to Telegram Operators
HermesEventBus.on('CustomerEscalated', async (event) => {
  try {
    const { HermesNotificationDispatcher } = await import('./notifications/notification-dispatcher');
    const { db } = await import('@saasfly/db-core');
    const { projects } = await import('@saasfly/db-core/schema');
    const { eq } = await import('@saasfly/db-core');

    // Resolve project organizationId & title
    const [project] = await db
      .select({
        organizationId: projects.organizationId,
        title: projects.title,
      })
      .from(projects)
      .where(eq(projects.id, event.projectId))
      .limit(1);

    if (project?.organizationId) {
      const dispatcher = new HermesNotificationDispatcher();
      await dispatcher.dispatchHumanEscalation(project.organizationId, project.title, {
        chatId: event.chatId,
        reason: event.payload.reason || 'Escalación automática por baja certeza o solicitud de cliente',
        summary: event.payload.summary || event.payload.lastUserMessage,
        conversationId: event.payload.conversationId,
        customerName: event.payload.customerName,
      });
    }
  } catch (err: any) {
    console.error('[EventBus Telegram Escalation Error]:', err?.message || err);
  }
});

// Dispatch Fact Discovered to Telegram Operators
HermesEventBus.on('KnowledgeUpdated', async (event) => {
  try {
    const fact = event.payload?.fact;
    if (!fact || (fact.status !== 'DISCOVERED' && fact.status !== 'PENDING_REVIEW')) {
      return;
    }

    const { HermesNotificationDispatcher } = await import('./notifications/notification-dispatcher');
    const { db } = await import('@saasfly/db-core');
    const { projects } = await import('@saasfly/db-core/schema');
    const { eq } = await import('@saasfly/db-core');

    const [project] = await db
      .select({
        organizationId: projects.organizationId,
        title: projects.title,
      })
      .from(projects)
      .where(eq(projects.id, event.projectId))
      .limit(1);

    if (project?.organizationId) {
      const dispatcher = new HermesNotificationDispatcher();
      await dispatcher.dispatchFactDiscovered(project.organizationId, project.title, {
        factId: fact.id,
        dimension: fact.dimension || 'identity',
        key: fact.key || 'Dato no clasificado',
        content: fact.content || '',
        source: fact.source,
      });
    }
  } catch (err: any) {
    console.error('[EventBus Telegram Fact Error]:', err?.message || err);
  }
});

// Log Appointments
HermesEventBus.on('AppointmentCreated', async (event) => {
  console.log(`[EventBus] Appointment scheduled for Project ${event.projectId}:`, event.payload);
});

// Proactive Follow-up Listener for Qualified Leads
HermesEventBus.on('LeadQualified', async (event) => {
  try {
    const { leadId, email, name, phone, reason } = event.payload || {};
    const { db } = await import('@saasfly/db-core');
    const { marketingLeads, projects } = await import('@saasfly/db-core/schema');
    const { eq } = await import('@saasfly/db-core');

    let targetEmail = email;
    let targetName = name;
    let leadRecord: any = null;
    const lookupId = event.chatId || leadId;

    if (lookupId) {
      const [found] = await db
        .select()
        .from(marketingLeads)
        .where(eq(marketingLeads.id, lookupId))
        .limit(1);
      leadRecord = found;
      if (found) {
        targetEmail = targetEmail || found.email;
        targetName = targetName || found.name;
      }
    }

    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        organizationId: projects.organizationId,
      })
      .from(projects)
      .where(eq(projects.id, event.projectId))
      .limit(1);

    const projectTitle = project?.title || 'Pandoras Growth OS';

    // 1. Dispatch follow-up email if email exists
    if (targetEmail) {
      const { sendEmail } = await import('@saasfly/shared');
      const actionUrl = project?.slug 
        ? `https://dash.pandoras.finance/ecosystem/${project.slug}`
        : 'https://dash.pandoras.finance';

      await sendEmail({
        from: 'Hermes Growth OS <hermes@pandoras.finance>',
        to: [targetEmail],
        subject: `Bienvenido a ${projectTitle} — Siguientes pasos para tu activación`,
        text: `Hola ${targetName || 'futuro partner'},\n\nHemos calificado tu interés en ${projectTitle}. Puedes continuar tu onboarding y revisar tu propuesta en el siguiente enlace:\n${actionUrl}\n\nEquipo Hermes & Pandoras`,
        html: `<p>Hola <strong>${targetName || 'futuro partner'}</strong>,</p><p>Hemos calificado tu interés en <strong>${projectTitle}</strong>.</p><p>Puedes continuar tu onboarding y revisar tu propuesta en el siguiente enlace:</p><p><a href="${actionUrl}">${actionUrl}</a></p><p>— Equipo Hermes & Pandoras</p>`,
      });
    }

    // 2. Dispatch Notification to Operators if organization exists
    if (project?.organizationId) {
      const { HermesNotificationDispatcher } = await import('./notifications/notification-dispatcher');
      const dispatcher = new HermesNotificationDispatcher();
      await dispatcher.dispatchHumanEscalation(project.organizationId, projectTitle, {
        chatId: event.chatId,
        reason: `Lead Calificado (${reason || 'calificación automática'}): ${targetName || targetEmail || 'Lead'}`,
        summary: `Lead ID: ${lookupId} | Email: ${targetEmail || 'N/A'} | Tel: ${phone || leadRecord?.phoneNumber || 'N/A'}`,
        conversationId: event.payload?.conversationId,
        customerName: targetName,
      });
    }
  } catch (err: any) {
    console.error('[EventBus LeadQualified Error]:', err?.message || err);
  }
});

