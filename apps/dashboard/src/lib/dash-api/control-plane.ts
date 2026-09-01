/**
 * 🔌 Dash API Client — Growth OS / Control Plane Adapter
 * src/lib/dash-api/control-plane.ts
 */

import type { ControlPlaneOverviewDTO, GetPendingIntentsResponseDTO, OperationalIntentDTO } from '@/lib/dash-contracts/control-plane';
import type { DashApiError } from '@/lib/dash-contracts/journeys';
import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';

export class DashApiControlPlaneClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  async getOverview(organizationId: string, init?: RequestInit): Promise<ControlPlaneOverviewDTO> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/control-plane/overview?organizationId=${encodeURIComponent(organizationId)}`;
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
        message: `HTTP ${res.status}: Failed to fetch control plane overview`,
      }));
      throw new Error(`[DashApi.controlPlane.getOverview] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async getPendingIntents(organizationId: string, init?: RequestInit): Promise<OperationalIntentDTO[]> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/control-plane/intents?organizationId=${encodeURIComponent(organizationId)}`;
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
        message: `HTTP ${res.status}: Failed to fetch pending intents`,
      }));
      throw new Error(`[DashApi.controlPlane.getPendingIntents] ${error.code}: ${error.message}`);
    }

    const data: GetPendingIntentsResponseDTO = await res.json();
    return data.pendingIntents || [];
  }

  async approveIntent(organizationId: string, intentId: string, reason?: string, init?: RequestInit): Promise<{ success: boolean }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/control-plane/intents`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ action: 'APPROVE', organizationId, intentId, reason }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to approve intent`,
      }));
      throw new Error(`[DashApi.controlPlane.approveIntent] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async rejectIntent(organizationId: string, intentId: string, reason?: string, init?: RequestInit): Promise<{ success: boolean }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/control-plane/intents`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ action: 'REJECT', organizationId, intentId, reason }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to reject intent`,
      }));
      throw new Error(`[DashApi.controlPlane.rejectIntent] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }

  async simulateIntent(organizationId: string, init?: RequestInit): Promise<{ success: boolean; intentId: string }> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}/api/v1/control-plane/intents`;
    const res = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers || {}),
      },
      body: JSON.stringify({ action: 'SIMULATE', organizationId }),
    });

    if (!res.ok) {
      const error: DashApiError = await res.json().catch(() => ({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${res.status}: Failed to simulate intent`,
      }));
      throw new Error(`[DashApi.controlPlane.simulateIntent] ${error.code}: ${error.message}`);
    }

    return await res.json();
  }
}

export const dashControlPlaneApi = new DashApiControlPlaneClient();
