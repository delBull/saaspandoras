/**
 * 🔌 Dash API Client — Hermes Conversations Adapter
 * src/lib/dash-api/conversations.ts
 */

import type { 
  GetConversationMessagesResponseDTO, 
  ConversationMessageDTO, 
  ManualTakeoverResponseDTO 
} from '@/lib/dash-contracts/conversations';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiConversationsClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async listSummaries(organizationSlug: string, init?: RequestInit): Promise<any[]> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/conversations?organizationSlug=${encodeURIComponent(organizationSlug)}`;
    const res = await fetch(url, {
      ...init,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to fetch conversations`,
      }));
      throw new Error(`[DashApi.conversations.listSummaries] ${error.code}: ${error.message}`);
    }

    const data = await res.json();
    return data.conversations || [];
  }

  async getMessages(organizationSlug: string, conversationId: string, init?: RequestInit): Promise<ConversationMessageDTO[]> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/conversations?organizationSlug=${encodeURIComponent(organizationSlug)}&conversationId=${encodeURIComponent(conversationId)}`;
    const res = await fetch(url, {
      ...init,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to fetch conversation messages`,
      }));
      throw new Error(`[DashApi.conversations.getMessages] ${error.code}: ${error.message}`);
    }

    const data: GetConversationMessagesResponseDTO = await res.json();
    return data.messages || [];
  }

  async triggerTakeover(conversationId: string, operatorId?: string, reason?: string, init?: RequestInit): Promise<ManualTakeoverResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/conversations`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ conversationId, operatorId, reason }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to trigger takeover`,
      }));
      throw new Error(`[DashApi.conversations.triggerTakeover] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashConversationsApi = new DashApiConversationsClient();
