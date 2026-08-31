/**
 * 🔌 Dash API Client — Hermes Settings Adapter
 * src/lib/dash-api/settings.ts
 */

import type { GetSettingsResponseDTO, TenantSettingsDataDTO } from '@/lib/dash-contracts/settings';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiSettingsClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async get(organizationSlug: string, init?: RequestInit): Promise<GetSettingsResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/settings?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch settings`,
      }));
      throw new Error(`[DashApi.settings.get] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async update(settings: Partial<TenantSettingsDataDTO>, init?: RequestInit): Promise<{ success: boolean }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/settings`;
    const res = await fetch(url, {
      ...init,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to update settings`,
      }));
      throw new Error(`[DashApi.settings.update] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async createApiKey(name: string, permissions: string[] = ['hermes.chat', 'knowledge.read'], init?: RequestInit): Promise<{ success: boolean; apiKey: string; key: any }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/settings`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ name, permissions }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to generate API key`,
      }));
      throw new Error(`[DashApi.settings.createApiKey] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async revokeApiKey(keyId: string, init?: RequestInit): Promise<{ success: boolean }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/settings?keyId=${encodeURIComponent(keyId)}`;
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
        message: `HTTP ${res.status}: Failed to revoke API key`,
      }));
      throw new Error(`[DashApi.settings.revokeApiKey] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashSettingsApi = new DashApiSettingsClient();
