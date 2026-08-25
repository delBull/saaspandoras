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
    const { HermesNotificationDispatcher } = await import('@/lib/hermes/notifications/notification-dispatcher');
    const { db } = await import('@/db');
    const { projects } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

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

    const { HermesNotificationDispatcher } = await import('@/lib/hermes/notifications/notification-dispatcher');
    const { db } = await import('@/db');
    const { projects } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

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

