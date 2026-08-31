/**
 * 🔌 Dash API Client — Hermes Epistemic Policies Adapter
 * src/lib/dash-api/policies.ts
 */

import type { 
  GetPoliciesResponseDTO, 
  PolicyDTO, 
  SavePolicyResponseDTO 
} from '@/lib/dash-contracts/policies';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiPoliciesClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async list(organizationSlug: string, init?: RequestInit): Promise<PolicyDTO[]> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/policies?organizationSlug=${encodeURIComponent(organizationSlug)}`;
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
        message: `HTTP ${res.status}: Failed to fetch policies`,
      }));
      throw new Error(`[DashApi.policies.list] ${error.code}: ${error.message}`);
    }

    const data: GetPoliciesResponseDTO = await res.json();
    return data.policies || [];
  }

  async save(key: string, content: string, init?: RequestInit): Promise<SavePolicyResponseDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/hermes/policies`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ key, content }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to save policy`,
      }));
      throw new Error(`[DashApi.policies.save] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashPoliciesApi = new DashApiPoliciesClient();
