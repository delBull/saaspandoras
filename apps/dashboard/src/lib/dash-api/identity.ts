/**
 * 🔌 Dash API Client — Hermes Identity Adapter
 * src/lib/dash-api/identity.ts
 */

import type { GetIdentityResponseDTO, TeamMemberDTO } from '@/lib/dash-contracts/identity';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiIdentityClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async get(organizationSlug: string, init?: RequestInit): Promise<GetIdentityResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/identity?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch identity data`,
      }));
      throw new Error(`[DashApi.identity.get] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async inviteMember(email: string, role: string = 'Member', init?: RequestInit): Promise<{ success: boolean; member: any }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/identity`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ email, role }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to invite member`,
      }));
      throw new Error(`[DashApi.identity.inviteMember] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashIdentityApi = new DashApiIdentityClient();
