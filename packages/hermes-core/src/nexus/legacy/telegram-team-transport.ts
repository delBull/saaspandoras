/**
 * 📡 Nexus Telegram Team Transport
 * apps/dashboard/src/lib/nexus/telegram-team-transport.ts
 *
 * Isolated transport layer for @nexusPandoras_bot (Nexus OS · Team).
 *
 * Responsibilities:
 *  1. Validate the incoming Telegram webhook secret token (fail-closed).
 *  2. Provide a typed Telegram Bot API client for the Team bot.
 *  3. Helper to build and send messages with inline keyboards.
 *
 * Invariants:
 *  - NEVER mixes business logic, identity resolution, or RBAC.
 *  - NEVER uses TELEGRAM_BOT_TOKEN (Hermes Client Bot). Always uses TELEGRAM_TEAM_BOT_TOKEN.
 *  - All errors are thrown; callers decide how to surface them.
 */

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: TelegramUser;
    chat: { id: number; type: string; username?: string };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

export interface SendMessageParams {
  chat_id: number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
  disable_web_page_preview?: boolean;
}

export interface AnswerCallbackQueryParams {
  callback_query_id: string;
  text?: string;
  show_alert?: boolean;
}

export class NexusTeamTransport {
  private readonly botToken: string;
  private readonly apiBase: string;

  constructor(botToken?: string) {
    // Read from arg first, then env. Both must be non-empty strings.
    const token = (botToken ?? process.env.TELEGRAM_TEAM_BOT_TOKEN ?? '').trim();
    if (!token) {
      throw new Error(
        '[NexusTeamTransport] TELEGRAM_TEAM_BOT_TOKEN is not configured. Cannot initialize team transport.'
      );
    }
    this.botToken = token;
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Validates the incoming webhook secret token (fail-closed).
   * Must match TELEGRAM_TEAM_WEBHOOK_SECRET exactly.
   */
  static validateWebhookSecret(incoming: string | null): boolean {
    const expected = process.env.TELEGRAM_TEAM_WEBHOOK_SECRET;
    if (!expected || !incoming) return false;
    // Constant-time comparison to prevent timing attacks
    if (incoming.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < incoming.length; i++) {
      mismatch |= incoming.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return mismatch === 0;
  }

  /**
   * Sends a message to a Telegram chat.
   */
  async sendMessage(params: SendMessageParams): Promise<unknown> {
    const res = await fetch(`${this.apiBase}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disable_web_page_preview: true, ...params }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      console.error('[NexusTeamTransport] sendMessage failed:', err);
      throw new Error(`Telegram sendMessage failed: ${res.status} ${err}`);
    }

    return res.json();
  }

  /**
   * Answers a callback query (removes the loading spinner on the button).
   */
  async answerCallbackQuery(params: AnswerCallbackQueryParams): Promise<void> {
    const res = await fetch(`${this.apiBase}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      console.error('[NexusTeamTransport] answerCallbackQuery failed:', err);
    }
  }

  /**
   * Sets the menu button for a specific chat or globally.
   * Configures the persistent "Open Nexus" button in the chat header.
   */
  async setChatMenuButton(chatId?: number): Promise<void> {
    const tmaUrl = process.env.NEXUS_TMA_URL;
    if (!tmaUrl) {
      console.warn('[NexusTeamTransport] NEXUS_TMA_URL not set; skipping menu button config.');
      return;
    }

    const payload: Record<string, unknown> = {
      menu_button: {
        type: 'web_app',
        text: '⚡ Nexus Command',
        web_app: { url: tmaUrl },
      },
    };
    if (chatId) payload.chat_id = chatId;

    const res = await fetch(`${this.apiBase}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      console.warn('[NexusTeamTransport] setChatMenuButton failed:', err);
    }
  }

  /**
   * Registers this application's webhook with Telegram.
   * Call this once during deployment or via the admin script.
   */
  async registerWebhook(webhookUrl: string, secretToken: string): Promise<{ ok: boolean; description?: string }> {
    const res = await fetch(`${this.apiBase}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false,
      }),
    });

    const data = await res.json() as { ok: boolean; description?: string };
    return data;
  }

  /**
   * Fetches current webhook info from Telegram (for diagnostics).
   */
  async getWebhookInfo(): Promise<unknown> {
    const res = await fetch(`${this.apiBase}/getWebhookInfo`);
    return res.json();
  }
}
