import * as crypto from 'crypto';

export interface PandorasClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface EmitEventParams {
  eventType: string;
  payload: Record<string, any>;
  projectId?: number;
  timestamp?: string;
  idempotencyKey?: string;
}

export interface EmitEventResult {
  success: boolean;
  eventId?: string;
  canonicalId?: string;
  status?: string;
  error?: string;
}

export interface LeadStatusParams {
  email?: string;
  leadId?: string;
}

export interface LeadStatusResult {
  success: boolean;
  lead?: {
    id: string;
    email: string;
    stage: string;
    score: number;
    createdAt?: string;
  };
  error?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatA2AParams {
  messages: ChatMessage[];
  contextScope?: Record<string, any>;
  toolsAllowed?: string[];
}

export interface ChatA2AResult {
  success: boolean;
  response?: string;
  model?: string;
  runtime?: string;
  error?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Headless TypeScript/Node.js client for Pandora's Growth OS API
 */
export class PandorasClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: PandorasClientConfig) {
    if (!config?.apiKey) {
      throw new Error('[PandorasClient] apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://dash.pandoras.finance/api/v1').replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs || 10000;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMsg);
      }

      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Emits an integration event to the Event Spine
   */
  async emitEvent(params: EmitEventParams): Promise<EmitEventResult> {
    const headers: Record<string, string> = {};
    if (params.idempotencyKey) {
      headers['Idempotency-Key'] = params.idempotencyKey;
    }

    const res = await this.request<any>('/integrations/events', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventType: params.eventType,
        payload: params.payload,
        projectId: params.projectId,
        timestamp: params.timestamp,
      }),
    });

    return {
      success: true,
      eventId: res.eventId,
      canonicalId: res.canonicalId,
      status: res.status,
    };
  }

  /**
   * Fetches status of a lead from the CRM
   */
  async getLeadStatus(params: LeadStatusParams): Promise<LeadStatusResult> {
    const query = new URLSearchParams();
    if (params.email) query.set('email', params.email);
    if (params.leadId) query.set('leadId', params.leadId);

    const queryString = query.toString();
    const endpoint = `/leads/status${queryString ? `?${queryString}` : ''}`;

    const res = await this.request<any>(endpoint, {
      method: 'GET',
    });

    return {
      success: true,
      lead: res.lead,
    };
  }

  /**
   * Sends structured conversation to Hermes A2A Gateway
   */
  async chatA2A(params: ChatA2AParams): Promise<ChatA2AResult> {
    const res = await this.request<any>('/hermes/a2a/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return {
      success: true,
      response: res.response,
      model: res.model,
      runtime: res.runtime,
    };
  }

  /**
   * Verifies an incoming webhook HMAC signature
   * @param rawBody Raw body as utf8 string or Buffer
   * @param signature The x-core-signature header
   * @param secret The webhook callback secret (whsec_...)
   */
  static verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string
  ): WebhookVerificationResult {
    if (!rawBody) return { isValid: false, reason: 'Missing rawBody' };
    if (!signature) return { isValid: false, reason: 'Missing signature' };
    if (!secret) return { isValid: false, reason: 'Missing secret' };

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(bodyString, 'utf8')
      .digest('hex');

    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSig, 'hex');

      if (sigBuffer.length !== expectedBuffer.length) {
        return { isValid: false, reason: 'Signature length mismatch' };
      }

      const match = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
      return {
        isValid: match,
        reason: match ? undefined : 'Signature mismatch',
      };
    } catch {
      return { isValid: false, reason: 'Invalid signature format' };
    }
  }
}
