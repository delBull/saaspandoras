import { 
  HermesTenantMembershipService, 
  AuthorizedTenant
} from '@/lib/hermes/auth';
import { sendTelegramMessage } from '@/lib/hermes/telegram-runtime/router';
import { collectSystemStatus, buildStatusMessage } from '@/lib/hermes/bot/system-status';

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

    if (command === '/switch') {
      return this.executeSwitchCommand(chatId, telegramUserId);
    }

    // Default Fallback
    const fallbackText = `🤖 <b>Hermes OS Command Center (@pandorasHermes_bot)</b>\n\n` +
      `Usa los comandos del operador:\n` +
      `• /portal — Abrir la Mini App de Hermes OS\n` +
      `• /status — Estado de salud del sistema y bóvedas IPFS\n` +
      `• /switch — Conmutar de Workspace / Organización\n` +
      `• /start — Menú principal de control`;

    await sendTelegramMessage(this.botToken, chatId, fallbackText);
    return { handled: true, action: 'FALLBACK' };
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

    await sendTelegramMessage(this.botToken, chatId, welcomeText, { inline_keyboard: inlineKeyboard });
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

    await sendTelegramMessage(this.botToken, chatId, text, keyboard);
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
              { text: '📊 Estado del Sistema', callback_data: 'cmd:status' },
              { text: '🔄 Cambiar Workspace', callback_data: 'cmd:switch' }
            ]
          ]
        };

        await sendTelegramMessage(this.botToken, chatId, successText, keyboard);
        return { handled: true, action: 'SWITCH_SUCCESS' };
      } catch (err: any) {
        await sendTelegramMessage(this.botToken, chatId, `❌ Error al conmutar workspace: ${escapeHtml(err.message)}`);
        return { handled: true, action: 'SWITCH_DENIED' };
      }
    }

    return { handled: false };
  }
}
