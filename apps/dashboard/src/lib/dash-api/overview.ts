/**
 * 🔌 Dash API Client — Hermes Overview Adapter
 * src/lib/dash-api/overview.ts
 */

import type { GetOverviewResponseDTO } from '@/lib/dash-contracts/overview';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiOverviewClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async get(organizationSlug: string, init?: RequestInit): Promise<GetOverviewResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/overview?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch overview`,
      }));
      throw new Error(`[DashApi.overview.get] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashOverviewApi = new DashApiOverviewClient();
