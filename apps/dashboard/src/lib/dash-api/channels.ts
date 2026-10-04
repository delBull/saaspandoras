/**
 * 🔌 Dash API Client — Hermes Channels Adapter
 * src/lib/dash-api/channels.ts
 */

import type { MaskedChannelsConfigDTO, SaveChannelConfigRequestDTO } from '@saasfly/shared';
import type { DashApiError } from '@saasfly/shared';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiChannelsClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async getConfig(organizationSlug: string, init?: RequestInit): Promise<MaskedChannelsConfigDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/channels?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch channels config`,
      }));
      throw new Error(`[DashApi.channels.getConfig] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async saveConfig(request: SaveChannelConfigRequestDTO, init?: RequestInit): Promise<{ success: boolean }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/channels`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to update channels config`,
      }));
      throw new Error(`[DashApi.channels.saveConfig] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashChannelsApi = new DashApiChannelsClient();
