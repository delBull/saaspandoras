/**
 * 🔌 Dash API Client — Hermes Knowledge Adapter
 * src/lib/dash-api/knowledge.ts
 */

import type { 
  GetKnowledgeResponseDTO, 
  AddKnowledgeSourceRequestDTO, 
  AddKnowledgeSourceResponseDTO,
  UpdateKnowledgeFactStatusResponseDTO 
} from '@/lib/dash-contracts/knowledge';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiKnowledgeClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async getOverview(organizationSlug: string, init?: RequestInit): Promise<GetKnowledgeResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/knowledge?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch knowledge`,
      }));
      throw new Error(`[DashApi.knowledge.getOverview] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async addSource(source: AddKnowledgeSourceRequestDTO, init?: RequestInit): Promise<AddKnowledgeSourceResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/knowledge`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify(source),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to add source`,
      }));
      throw new Error(`[DashApi.knowledge.addSource] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async updateFactStatus(factId: string, status: 'ACTIVE' | 'REJECTED', init?: RequestInit): Promise<UpdateKnowledgeFactStatusResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/knowledge`;
    const res = await fetch(url, {
      ...init,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ factId, status }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to update fact`,
      }));
      throw new Error(`[DashApi.knowledge.updateFactStatus] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashKnowledgeApi = new DashApiKnowledgeClient();
