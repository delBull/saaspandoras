import { 
  HermesTenantMembershipService, 
  AuthorizedTenant
} from '@/lib/hermes/auth';
import { sendTelegramMessage, setTelegramChatMenuButton } from '@/lib/hermes/telegram-runtime/router';
import { collectSystemStatus, buildStatusMessage } from '@/lib/hermes/bot/system-status';
import { db } from '@/db';
import { hermesJourneys, hermesJourneyStages, hermesAddonInstallations, projects } from '@/db/schema';
import { eq, or, asc } from 'drizzle-orm';
import { CANONICAL_ADDONS, ensureCanonicalAddOnsRegistered } from '@/lib/pandoras/core/domains/hermes/addons/catalog';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot?: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      username?: string;
      first_name?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
      text?: string;
    };
    data?: string;
  };
}

export interface HermesBotExecutionResult {
  handled: boolean;
  action?: string;
  replySent?: boolean;
  error?: string;
  data?: any;
}

export function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class HermesOSBotAdapter {
  private botToken: string;
  private tmaBaseUrl: string;
  private membershipService: HermesTenantMembershipService;

  constructor(options: { botToken?: string; tmaBaseUrl?: string } = {}) {
    this.botToken = options.botToken || process.env.HERMES_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
    this.tmaBaseUrl = options.tmaBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    this.membershipService = new HermesTenantMembershipService();
  }

  /**
   * Main entrypoint to process Telegram webhook updates for @pandorasHermes_bot
   */
  async handleUpdate(update: TelegramUpdate): Promise<HermesBotExecutionResult> {
    if (!this.botToken) {
      console.error('[HermesOSBotAdapter] HERMES_BOT_TOKEN is not configured.');
      return { handled: false, error: 'MISSING_BOT_TOKEN' };
    }

    // 1. Handle Callback Queries (e.g. switch:<uuid>, cmd:status, cmd:switch)
    if (update.callback_query) {
      return this.handleCallbackQuery(update.callback_query);
    }

    // 2. Handle Text Messages & Commands
    if (update.message?.text) {
      return this.handleMessage(update.message);
    }

    return { handled: false };
  }

  private async handleMessage(message: NonNullable<TelegramUpdate['message']>): Promise<HermesBotExecutionResult> {
    const text = message.text?.trim() || '';
    const chatId = message.chat.id;
    const telegramUserId = String(message.from.id);
    const username = message.from.username;

    // Parse command and argument
    const parts = text.split(/\s+/);
    const command = (parts[0] || '').toLowerCase();
    const arg = parts[1] || '';

    if (command === '/start') {
      return this.executeStartCommand(chatId, telegramUserId, username, arg);
    }

    if (command === '/portal' || command === '/tma') {
      return this.executePortalCommand(chatId, telegramUserId, arg);
    }

    if (command === '/status') {
      return this.executeStatusCommand(chatId, telegramUserId);
    }

    if (command === '/help') {
      return this.executeHelpCommand(chatId);
    }

    if (command === '/switch') {
      return this.executeSwitchCommand(chatId, telegramUserId);
    }

    if (command === '/journeys') {
      return this.executeJourneysCommand(chatId, telegramUserId);
    }

    if (command === '/addons') {
      return this.executeAddonsCommand(chatId, telegramUserId);
    }

    if (command === '/help') {
      return this.executeHelpCommand(chatId);
    }

    // Conversational Chat Fallback (Natural Language with Hermes Cognitive Runtime)
    return this.executeConversationalMessage(chatId, telegramUserId, text);
  }

  private async executeHelpCommand(chatId: number): Promise<HermesBotExecutionResult> {
    const helpText = `🤖 <b>Hermes OS Command Center (@pandorasHermes_bot)</b>\n\n` +
      `<b>Comandos de Operación:</b>\n` +
      `• <code>/start</code> — Menú principal e inicio de sesión en tu Workspace.\n` +
      `• <code>/portal</code> o <code>/tma</code> — Abrir la Mini App de Hermes OS.\n` +
      `• <code>/status</code> — Diagnóstico de salud (Postgres, IPFS y Bóvedas).\n` +
      `• <code>/journeys</code> — Embudos de conversión, etapas e hitos en vivo.\n` +
      `• <code>/addons</code> — Estrategias y Add-Ons cognitivos activos.\n` +
      `• <code>/switch</code> — Conmutar entre organizaciones/workspaces autorizados.\n` +
      `• <code>/help</code> — Guía de comandos y operación.\n\n` +
      `💡 <i>Para vincular tu Telegram a un Workspace, ingresa al Dashboard Web con tu wallet autorizada o agrega tu Telegram ID.</i>`;

    await sendTelegramMessage(this.botToken, chatId, helpText);
    return { handled: true, action: 'HELP' };
  }

  private async executeStartCommand(
    chatId: number, 
    telegramUserId: string, 
    username?: string, 
    intentSlug?: string
  ): Promise<HermesBotExecutionResult> {
    const tenants = await this.membershipService.getAuthorizedTenants(telegramUserId);

    if (tenants.length === 0) {
      const safeUsername = escapeHtml(username || 'Operador');
      const unauthText = `🏛️ <b>Hermes OS — Command Center</b>\n\n` +
        `Hola ${username ? `@${safeUsername}` : 'Operador'}. Tu cuenta de Telegram (ID: <code>${escapeHtml(telegramUserId)}</code>) no tiene workspaces vinculados en Hermes OS.\n\n` +
        `ℹ️ <i>Para vincular tu cuenta, entra al Dashboard web en tu organización y agrega tu Telegram ID o conecta tu wallet autorizada.</i>`;

      await sendTelegramMessage(this.botToken, chatId, unauthText);
      return { handled: true, action: 'START_UNAUTHORIZED' };
    }

    // Determine selected workspace (honoring intentSlug if valid and authorized)
    let activeTenant: AuthorizedTenant = tenants[0]!;
    if (intentSlug) {
      const cleanSlug = intentSlug.replace(/^org_/, '');
      const matched = tenants.find(
        t => t.tenantSlug?.toLowerCase() === cleanSlug.toLowerCase() || t.organizationId.toLowerCase() === cleanSlug.toLowerCase()
      );
      if (matched) {
        activeTenant = matched;
      }
    }

    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;

    const welcomeText = `🏛️ <b>Hermes OS — Command Center</b>\n\n` +
      `Operador: <b>${username ? `@${escapeHtml(username)}` : escapeHtml(telegramUserId)}</b>\n` +
      `Workspace Activo: <b>${escapeHtml(activeTenant.organizationName)}</b> (Rol: <code>${escapeHtml(activeTenant.role)}</code>)\n\n` +
      `Selecciona una acción operativa:`;

    const inlineKeyboard: any[][] = [
      [
        {
          text: '🚀 Abrir Command Center (TMA)',
          web_app: { url: tmaUrl }
        }
      ],
      [
        { text: '📊 Estado del Sistema', callback_data: 'cmd:status' },
      ]
    ];

    if (tenants.length > 1) {
      inlineKeyboard.push([
        { text: `🔄 Cambiar Workspace (${tenants.length} disponibles)`, callback_data: 'cmd:switch' }
      ]);
    }

    await Promise.all([
      sendTelegramMessage(this.botToken, chatId, welcomeText, { inline_keyboard: inlineKeyboard }),
      setTelegramChatMenuButton(this.botToken, chatId, '🚀 Command Center', tmaUrl).catch(() => null),
    ]);
    return { handled: true, action: 'START_SUCCESS' };
  }

  private async executePortalCommand(
    chatId: number, 
    telegramUserId: string, 
    intentSlug?: string
  ): Promise<HermesBotExecutionResult> {
    const tenants = await this.membershipService.getAuthorizedTenants(telegramUserId);

    if (tenants.length === 0) {
      await sendTelegramMessage(this.botToken, chatId, `⚠️ No tienes workspaces autorizados en Hermes OS.`);
      return { handled: true, action: 'PORTAL_UNAUTHORIZED' };
    }

    let activeTenant = tenants[0]!;
    if (intentSlug) {
      const cleanSlug = intentSlug.replace(/^org_/, '');
      const matched = tenants.find(
        t => t.tenantSlug?.toLowerCase() === cleanSlug.toLowerCase() || t.organizationId.toLowerCase() === cleanSlug.toLowerCase()
      );
      if (matched) activeTenant = matched;
    }

    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;

    const text = `📱 <b>Hermes OS Command Center</b>\nWorkspace: <b>${escapeHtml(activeTenant.organizationName)}</b>`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: '⚡ Entrar al Command Center', web_app: { url: tmaUrl } }
        ]
      ]
    };

    await Promise.all([
      sendTelegramMessage(this.botToken, chatId, text, keyboard),
      setTelegramChatMenuButton(this.botToken, chatId, '🚀 Command Center', tmaUrl).catch(() => null),
    ]);
    return { handled: true, action: 'PORTAL_LAUNCH' };
  }

  private async executeStatusCommand(chatId: number, telegramUserId: string): Promise<HermesBotExecutionResult> {
    const tenants = await this.membershipService.getAuthorizedTenants(telegramUserId);

    if (tenants.length === 0) {
      await sendTelegramMessage(this.botToken, chatId, `⚠️ No tienes acceso a métricas de estado.`);
      return { handled: true, action: 'STATUS_UNAUTHORIZED' };
    }

    const activeTenant = tenants[0]!;
    const status = await collectSystemStatus(activeTenant.organizationId);
    const statusText = buildStatusMessage(status, activeTenant.organizationName, tenants.length);

    await sendTelegramMessage(this.botToken, chatId, statusText);
    return {
      handled: true,
      action: 'STATUS_SUCCESS',
      data: { ...status }
    };
  }

  private async executeSwitchCommand(chatId: number, telegramUserId: string): Promise<HermesBotExecutionResult> {
    const tenants = await this.membershipService.getAuthorizedTenants(telegramUserId);

    if (tenants.length === 0) {
      await sendTelegramMessage(this.botToken, chatId, `⚠️ No tienes workspaces para conmutar.`);
      return { handled: true, action: 'SWITCH_EMPTY' };
    }

    const keyboard = {
      inline_keyboard: tenants.map(t => [
        {
          text: `${t.isOwner ? '👑' : '🏢'} ${t.organizationName} (${t.role})`,
          callback_data: `switch:${t.organizationId}`
        }
      ])
    };

    const text = `🔄 <b>Selecciona el Workspace Activo:</b>\n` +
      `Elige una organización para gestionar su Hermes OS:`;

    await sendTelegramMessage(this.botToken, chatId, text, keyboard);
    return { handled: true, action: 'SWITCH_LIST' };
  }

  private async handleCallbackQuery(
    callbackQuery: NonNullable<TelegramUpdate['callback_query']>
  ): Promise<HermesBotExecutionResult> {
    const data = callbackQuery.data || '';
    const chatId = callbackQuery.message?.chat.id;
    const telegramUserId = String(callbackQuery.from.id);

    if (!chatId) return { handled: false };

    if (data === 'cmd:status') {
      return this.executeStatusCommand(chatId, telegramUserId);
    }

    if (data === 'cmd:switch') {
      return this.executeSwitchCommand(chatId, telegramUserId);
    }

    if (data === 'cmd:journeys') {
      return this.executeJourneysCommand(chatId, telegramUserId);
    }

    if (data === 'cmd:addons') {
      return this.executeAddonsCommand(chatId, telegramUserId);
    }

    if (data.startsWith('switch:')) {
      const targetOrgId = data.replace('switch:', '');
      try {
        const session = await this.membershipService.validateTenantAccess({
          telegramUserId,
          targetOrganizationId: targetOrgId,
          username: callbackQuery.from.username,
        });

        const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(session.tenant.tenantSlug || session.tenant.organizationId)}`;

        const successText = `✅ <b>Workspace Activo Conmutado:</b>\n` +
          `Organización: <b>${escapeHtml(session.tenant.organizationName)}</b>\n` +
          `Rol: <code>${escapeHtml(session.role)}</code>\n\n` +
          `Tu Command Center ahora opera sobre este workspace.`;

        const keyboard = {
          inline_keyboard: [
            [
              { text: '🚀 Abrir Command Center (TMA)', web_app: { url: tmaUrl } }
            ],
            [
              { text: '📊 Estado', callback_data: 'cmd:status' },
              { text: '🎯 Journeys', callback_data: 'cmd:journeys' },
              { text: '🧩 Add-Ons', callback_data: 'cmd:addons' }
            ],
            [
              { text: '🔄 Cambiar Workspace', callback_data: 'cmd:switch' }
            ]
          ]
        };

        await Promise.all([
          sendTelegramMessage(this.botToken, chatId, successText, keyboard),
          setTelegramChatMenuButton(this.botToken, chatId, '🚀 Command Center', tmaUrl).catch(() => null),
        ]);
        return { handled: true, action: 'SWITCH_SUCCESS' };
      } catch (err: any) {
        await sendTelegramMessage(this.botToken, chatId, `❌ Error al conmutar workspace: ${escapeHtml(err.message)}`);
        return { handled: true, action: 'SWITCH_DENIED' };
      }
    }

    return { handled: false };
  }

  private async executeJourneysCommand(chatId: number, telegramUserId: string): Promise<HermesBotExecutionResult> {
    const tenants = await this.membershipService.getAuthorizedTenants(telegramUserId);
    if (tenants.length === 0) {
      await sendTelegramMessage(this.botToken, chatId, `⚠️ No tienes workspaces autorizados en Hermes OS.`);
      return { handled: true, action: 'JOURNEYS_UNAUTHORIZED' };
    }

    const activeTenant = tenants[0]!;
    const cleanTenant = (activeTenant.tenantSlug || activeTenant.organizationId).toLowerCase().replace(/^org_/, '');
    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;

    try {
      const journeys = await db
        .select()
        .from(hermesJourneys)
        .where(
          or(
            eq(hermesJourneys.organizationId, activeTenant.organizationId),
            eq(hermesJourneys.organizationId, cleanTenant)
          )
        )
        .orderBy(asc(hermesJourneys.createdAt));

      let msg = `🎯 <b>Journeys & Funnels — ${escapeHtml(activeTenant.organizationName)}</b>\n\n`;

      if (journeys.length === 0) {
        msg += `<i>No hay journeys configurados para este workspace.</i>\n`;
      } else {
        for (const j of journeys) {
          const stages = await db
            .select()
            .from(hermesJourneyStages)
            .where(eq(hermesJourneyStages.journeyId, j.id))
            .orderBy(asc(hermesJourneyStages.orderIndex));

          const statusEmoji = j.status === 'ACTIVE' ? '🟢' : '⏸️';
          msg += `${statusEmoji} <b>${escapeHtml(j.name)}</b> (v${j.version || 1})\n`;
          if (j.description) msg += `   <i>${escapeHtml(j.description)}</i>\n`;
          msg += `   <b>Etapas (${stages.length}):</b>\n`;
          for (const s of stages) {
            msg += `   • <code>${s.orderIndex + 1}.</code> ${escapeHtml(s.name)}\n`;
          }
          msg += `\n`;
        }
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '📱 Administrar Journeys en TMA', web_app: { url: tmaUrl } }],
          [{ text: '🔄 Actualizar', callback_data: 'cmd:journeys' }]
        ]
      };

      await sendTelegramMessage(this.botToken, chatId, msg, keyboard);
      return { handled: true, action: 'JOURNEYS_SUCCESS' };
    } catch (err: any) {
      console.error('[HermesOSBotAdapter] Journeys command error:', err);
      await sendTelegramMessage(this.botToken, chatId, `❌ Error al consultar journeys.`);
      return { handled: true, action: 'JOURNEYS_ERROR' };
    }
  }

  private async executeAddonsCommand(chatId: number, telegramUserId: string): Promise<HermesBotExecutionResult> {
    const tenants = await this.membershipService.getAuthorizedTenants(telegramUserId);
    if (tenants.length === 0) {
      await sendTelegramMessage(this.botToken, chatId, `⚠️ No tienes workspaces autorizados en Hermes OS.`);
      return { handled: true, action: 'ADDONS_UNAUTHORIZED' };
    }

    const activeTenant = tenants[0]!;
    const cleanTenant = (activeTenant.tenantSlug || activeTenant.organizationId).toLowerCase().replace(/^org_/, '');
    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;

    try {
      await ensureCanonicalAddOnsRegistered();

      const installations = await db
        .select()
        .from(hermesAddonInstallations)
        .where(
          or(
            eq(hermesAddonInstallations.organizationId, activeTenant.organizationId),
            eq(hermesAddonInstallations.organizationId, cleanTenant)
          )
        );

      const installedSet = new Set(
        installations.filter(i => i.status === 'ACTIVE').map(i => i.addonId)
      );

      let msg = `🧩 <b>Add-Ons & Estrategias Cognitivas — ${escapeHtml(activeTenant.organizationName)}</b>\n\n`;

      for (const addon of CANONICAL_ADDONS) {
        const isActive = installedSet.has(addon.id);
        const icon = isActive ? '✅' : '⚪';
        const statusText = isActive ? 'ACTIVO' : 'DISPONIBLE';
        msg += `${icon} <b>${escapeHtml(addon.name)}</b> [<code>${statusText}</code>]\n`;
        msg += `   <i>${escapeHtml(addon.description)}</i>\n`;
        msg += `   Tipo: <code>${addon.type}</code> · v${addon.version}\n\n`;
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '⚡ Activar / Desactivar en TMA', web_app: { url: tmaUrl } }],
          [{ text: '🔄 Actualizar', callback_data: 'cmd:addons' }]
        ]
      };

      await sendTelegramMessage(this.botToken, chatId, msg, keyboard);
      return { handled: true, action: 'ADDONS_SUCCESS' };
    } catch (err: any) {
      console.error('[HermesOSBotAdapter] Addons command error:', err);
      await sendTelegramMessage(this.botToken, chatId, `❌ Error al consultar addons.`);
      return { handled: true, action: 'ADDONS_ERROR' };
    }
  }

  private async executeConversationalMessage(
    chatId: number,
    telegramUserId: string,
    text: string
  ): Promise<HermesBotExecutionResult> {
    const tenants = await this.membershipService.getAuthorizedTenants(telegramUserId);
    if (tenants.length === 0) {
      const helpText = `🤖 <b>Hermes OS</b>\n\n` +
        `Hola. Tu cuenta de Telegram (ID: <code>${escapeHtml(telegramUserId)}</code>) no está vinculada a ningún Workspace activo en Hermes OS.\n\n` +
        `Usa <code>/start</code> para ver opciones o ingresa al Dashboard para vincular tu Telegram.`;
      await sendTelegramMessage(this.botToken, chatId, helpText);
      return { handled: true, action: 'UNAUTHORIZED_CHAT' };
    }

    const activeTenant = tenants[0]!;
    const cleanTenant = (activeTenant.tenantSlug || activeTenant.organizationId).toLowerCase().replace(/^org_/, '');
    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;

    try {
      // Find matching project in DB
      let projectRecord = await db.query.projects.findFirst({
        where: or(
          eq(projects.slug, cleanTenant),
          eq(projects.slug, activeTenant.organizationId)
        ),
      });

      if (!projectRecord) {
        const numId = parseInt(activeTenant.organizationId, 10);
        if (!isNaN(numId)) {
          projectRecord = await db.query.projects.findFirst({
            where: eq(projects.id, numId),
          });
        }
      }

      if (projectRecord) {
        const { HermesExecutionEngine } = await import('@/lib/hermes/kernel/execution/execution-api');
        const { TelegramAdapter } = await import('@/lib/hermes/adapters/telegram-adapter');

        const engine = new HermesExecutionEngine();
        const fakeUpdate = {
          message: {
            text,
            chat: { id: chatId },
            from: { id: parseInt(telegramUserId, 10) || 0 },
          },
          botToken: this.botToken,
          projectRecord,
          metadata: (projectRecord.w2eConfig as any) || {},
        };

        const context = TelegramAdapter.parse(projectRecord.id, fakeUpdate);
        const result = await engine.execute(context);
        const reply = TelegramAdapter.render(result);

        if (reply && reply.trim()) {
          const keyboard = {
            inline_keyboard: [
              [{ text: '🚀 Abrir Command Center (TMA)', web_app: { url: tmaUrl } }],
              [{ text: '📊 Estado', callback_data: 'cmd:status' }]
            ]
          };
          await sendTelegramMessage(this.botToken, chatId, reply, keyboard);
          return { handled: true, action: 'CONVERSATIONAL_REPLY', data: result };
        }
      }

      // Fallback if no specific project execution was rendered
      const fallbackMsg = `🤖 <b>Hermes OS [${escapeHtml(activeTenant.organizationName)}]</b>\n\n` +
        `Recibí tu consulta: <i>"${escapeHtml(text)}"</i>.\n\n` +
        `Puedes consultar el estado con <code>/status</code>, gestionar embudos con <code>/journeys</code> o abrir la Mini App para interactuar con tus agentes.`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🚀 Abrir Command Center (TMA)', web_app: { url: tmaUrl } }],
          [{ text: '📊 Estado del Sistema', callback_data: 'cmd:status' }],
          [{ text: '🎯 Journeys', callback_data: 'cmd:journeys' }]
        ]
      };

      await sendTelegramMessage(this.botToken, chatId, fallbackMsg, keyboard);
      return { handled: true, action: 'CONVERSATIONAL_FALLBACK' };
    } catch (err: any) {
      console.error('[HermesOSBotAdapter] Conversational message processing error:', err);
      await sendTelegramMessage(this.botToken, chatId, `⚠️ Ocurrió un error al procesar tu mensaje con Hermes OS.`);
      return { handled: true, action: 'CONVERSATIONAL_ERROR', error: err?.message };
    }
  }
}

