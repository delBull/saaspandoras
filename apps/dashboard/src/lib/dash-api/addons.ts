/**
 * 🔌 Dash API Client — Hermes Add-ons Adapter
 * src/lib/dash-api/addons.ts
 */

import type { 
  GetAddonsResponseDTO, 
  AddonStatusDTO, 
  ToggleAddonResponseDTO 
} from '@/lib/dash-contracts/addons';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiAddonsClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async list(organizationSlug: string, init?: RequestInit): Promise<AddonStatusDTO[]> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/addons?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch addons`,
      }));
      throw new Error(`[DashApi.addons.list] ${error.code}: ${error.message}`);
    }

    const data: GetAddonsResponseDTO = await res.json();
    return data.addons || [];
  }

  async toggle(addonId: string, active: boolean, init?: RequestInit): Promise<ToggleAddonResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/addons`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ addonId, active }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to toggle addon`,
      }));
      throw new Error(`[DashApi.addons.toggle] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashAddonsApi = new DashApiAddonsClient();
