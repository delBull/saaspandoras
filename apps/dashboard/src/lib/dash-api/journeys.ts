/**
 * 🔌 Dash API Client — Hermes Journeys Adapter
 * src/lib/dash-api/journeys.ts
 *
 * Provides a clean typed HTTP adapter for Dash frontend pages.
 * Zero database imports, zero internal schema coupling.
 */

import type { 
  GetJourneysResponseDTO, 
  JourneyDTO, 
  ToggleJourneyStatusResponseDTO,
  DashApiError
} from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiJourneysClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  /**
   * Fetch all persistent journeys for the authorized organization.
   */
  async list(organizationSlug: string, init?: RequestInit): Promise<JourneyDTO[]> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/journeys?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch journeys`,
      }));
      throw new Error(`[DashApi.journeys.list] ${error.code}: ${error.message}`);
    }

    const data: GetJourneysResponseDTO = await res.json();
    return data.journeys || [];
  }

  /**
   * Toggle journey activation status.
   */
  async toggleStatus(journeyId: string, active: boolean, init?: RequestInit): Promise<ToggleJourneyStatusResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/journeys`;
    const res = await fetch(url, {
      ...init,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ journeyId, active }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to update journey`,
      }));
      throw new Error(`[DashApi.journeys.toggleStatus] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async create(data: { name: string; description?: string; milestones: string[] }, init?: RequestInit): Promise<{ success: boolean; journeyId: string }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/journeys`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to create journey`,
      }));
      throw new Error(`[DashApi.journeys.create] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async update(journeyId: string, data: { name: string; description?: string; milestones: string[] }, init?: RequestInit): Promise<{ success: boolean }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/journeys`;
    const res = await fetch(url, {
      ...init,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ journeyId, ...data }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to update journey`,
      }));
      throw new Error(`[DashApi.journeys.update] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async delete(journeyId: string, init?: RequestInit): Promise<{ success: boolean }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/journeys?journeyId=${encodeURIComponent(journeyId)}`;
    const res = await fetch(url, {
      ...init,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to delete journey`,
      }));
      throw new Error(`[DashApi.journeys.delete] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashJourneysApi = new DashApiJourneysClient();
