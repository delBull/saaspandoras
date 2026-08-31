/**
 * 🔌 Dash API Client — Hermes Activity Adapter
 * src/lib/dash-api/activity.ts
 */

import type { GetActivityResponseDTO } from '@/lib/dash-contracts/activity';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiActivityClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async get(organizationSlug: string, init?: RequestInit): Promise<GetActivityResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/activity?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch activity`,
      }));
      throw new Error(`[DashApi.activity.get] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashActivityApi = new DashApiActivityClient();
