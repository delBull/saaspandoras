/**
 * Baileys QR Bridge Provider — WhatsApp Provider Layer 2
 *
 * Quick-Connect Pyme mode: links a personal WhatsApp number via QR scan
 * (like WhatsApp Web). No Meta Business account required.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TIER: quick_connect — Pyme / Sandbox / Pilot use
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * LIMITATIONS (must be communicated to clients):
 *  ⚠️  Session depends on the linked phone being online with WiFi/mobile data
 *  ⚠️  Meta may update the WhatsApp Web protocol — no official SLA
 *  ⚠️  May require periodic re-authentication (QR scan again)
 *  ⚠️  Not suitable for high-volume or mission-critical operations
 *
 * ARCHITECTURE:
 *  Hermes Runtime → IWhatsAppProvider → BaileysWhatsAppProvider → WHATSAPP_GATEWAY_URL
 *
 *  The Runtime NEVER talks to Baileys directly. It only knows IWhatsAppProvider.
 *  The Bridge is a separate long-running Node.js process (not serverless).
 *
 * BRIDGE REST API (standardized — could be Baileys, Evolution API, etc.):
 *  POST   /sessions              — Create a new session, returns QR
 *  GET    /sessions/:id          — Get session status + health
 *  DELETE /sessions/:id          — Terminate session
 *  POST   /messages              — Send outbound message
 *  GET    /health                — Bridge process health check
 */

import type {
  IWhatsAppProvider,
  WhatsAppOutboundMessage,
  WhatsAppProviderResponse,
  WhatsAppInboundMessage,
} from './types.js';

/** Generic gateway URL — works with Baileys, Evolution API, or any future bridge */
const GATEWAY_URL =
  process.env.WHATSAPP_GATEWAY_URL ??
  process.env.WHATSAPP_BRIDGE_URL ??   // legacy fallback
  'http://localhost:3100';

export interface SessionHealth {
  sessionId: string;
  status: 'connected' | 'pending_qr' | 'disconnected' | 'reconnecting';
  phoneNumber?: string;
  deviceName?: string;
  lastHeartbeat?: string;      // ISO timestamp
  lastSeen?: string;           // ISO timestamp
  reconnectAttempts?: number;
  qr?: string | null;
  qrExpiresAt?: string;        // ISO timestamp
  bridgeVersion?: string;
}

export class BaileysWhatsAppProvider implements IWhatsAppProvider {
  readonly providerId = 'baileys';
  readonly displayName = 'Baileys QR Quick-Connect';
  readonly tier = 'quick_connect' as const;

  constructor(private readonly sessionId: string) {}

  /**
   * Send outbound message via Bridge REST API.
   * POST GATEWAY_URL/messages
   */
  async sendMessage(message: WhatsAppOutboundMessage): Promise<WhatsAppProviderResponse> {
    try {
      const res = await fetch(`${GATEWAY_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          to: message.to.replace(/^\+/, '') + '@s.whatsapp.net',
          text: message.body,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Gateway error ${res.status}: ${err}` };
      }

      const json = (await res.json()) as Record<string, unknown>;
      return { success: true, messageId: json.id as string | undefined, rawResponse: json };
    } catch (err) {
      return { success: false, error: `Gateway unreachable (${GATEWAY_URL}): ${String(err)}` };
    }
  }

  /**
   * Bridge handles its own signature verification — always return true here.
   * Production: validate a shared secret header set by the bridge.
   */
  verifyWebhook(_payload: unknown, _signature: string): boolean {
    return true;
  }

  /**
   * Parse incoming webhook event from Bridge → normalized WhatsAppInboundMessage
   */
  parseInbound(payload: unknown): WhatsAppInboundMessage | null {
    try {
      const p = payload as Record<string, unknown>;
      if (!p.from || !p.id) return null;
      return {
        from: String(p.from).replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, ''),
        messageId: p.id as string,
        body: (p.text as string) ?? '',
        type: 'text',
        contactName: p.pushName as string | undefined,
        timestamp: p.timestamp ? Number(p.timestamp) : undefined,
      };
    } catch {
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Bridge Session Management (static — used by API routes)
  // ──────────────────────────────────────────────────────────────

  /**
   * POST /sessions — Create or re-initialize a session on the Bridge.
   * Returns initial session state (usually 'pending_qr' with a QR code).
   */
  static async initSession(sessionId: string): Promise<SessionHealth> {
    try {
      const res = await fetch(`${GATEWAY_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        return { sessionId, status: 'disconnected' };
      }

      return (await res.json()) as SessionHealth;
    } catch {
      return { sessionId, status: 'disconnected' };
    }
  }

  /**
   * GET /sessions/:id — Full session health including QR, phone number, heartbeat.
   */
  static async getSessionHealth(sessionId: string): Promise<SessionHealth> {
    try {
      const res = await fetch(`${GATEWAY_URL}/sessions/${sessionId}`);
      if (!res.ok) return { sessionId, status: 'disconnected' };
      return (await res.json()) as SessionHealth;
    } catch {
      return { sessionId, status: 'disconnected' };
    }
  }

  /**
   * DELETE /sessions/:id — Terminate and clear session from Bridge.
   */
  static async terminateSession(sessionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${GATEWAY_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * GET /health — Bridge process liveness check.
   */
  static async pingGateway(): Promise<boolean> {
    try {
      const res = await fetch(`${GATEWAY_URL}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }
}
