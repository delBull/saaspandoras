/**
 * 📦 DashApi — Growth OS Capabilities Transport Adapter
 * src/lib/dash-api/growth.ts
 */

import { resolveApiBaseUrl, getServerAuthHeaders } from './utils';
import type { 
  GetCapabilitiesResponseDTO,
  GrowthOverviewDTO,
  GetPipelineResponseDTO,
  GetEmailMarketingResponseDTO,
  GetNftLabResponseDTO,
  TenantWalletConfigDTO,
  UpdateTenantWalletRequestDTO,
  GetGrowthAnalyticsResponseDTO,
  GetAutomationsResponseDTO
} from '../dash-contracts/growth';

export class DashApiGrowth {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? resolveApiBaseUrl();
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const authHeaders = await getServerAuthHeaders();
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ code: 'UNKNOWN_ERROR', message: `HTTP ${res.status}` }));
      throw new Error(`[DashApi.growth] ${err.code || 'ERROR'}: ${err.message || 'Request failed'}`);
    }

    return await res.json();
  }

  /**
   * Get tenant capabilities profile and feature gates
   */
  async getCapabilities(organizationId: string): Promise<GetCapabilitiesResponseDTO> {
    return await this.request<GetCapabilitiesResponseDTO>(`/api/v1/growth/capabilities?organizationId=${encodeURIComponent(organizationId)}`);
  }

  /**
   * Get tenant growth overview and metrics
   */
  async getOverview(organizationId: string): Promise<GrowthOverviewDTO> {
    return await this.request<GrowthOverviewDTO>(`/api/v1/growth/overview?organizationId=${encodeURIComponent(organizationId)}`);
  }

  /**
   * Get CRM & Lead Pipeline for the organization
   */
  async getPipeline(organizationId: string): Promise<GetPipelineResponseDTO> {
    return await this.request<GetPipelineResponseDTO>(`/api/v1/growth/pipeline?organizationId=${encodeURIComponent(organizationId)}`);
  }

  /**
   * Get Email Marketing Templates & Campaigns
   */
  async getEmailMarketing(organizationId: string): Promise<GetEmailMarketingResponseDTO> {
    return await this.request<GetEmailMarketingResponseDTO>(`/api/v1/growth/email?organizationId=${encodeURIComponent(organizationId)}`);
  }

  /**
   * Get NFT Lab Collections & Chains
   */
  async getNftLab(organizationId: string): Promise<GetNftLabResponseDTO> {
    return await this.request<GetNftLabResponseDTO>(`/api/v1/growth/nft-lab?organizationId=${encodeURIComponent(organizationId)}`);
  }

  /**
   * Request NFT Minting Intent (Governed)
   */
  async requestNftMint(organizationId: string, payload: { collectionId: string; recipientAddress: string; tokenType?: string }): Promise<{ success: boolean; intentId: string; message: string }> {
    return await this.request<{ success: boolean; intentId: string; message: string }>('/api/v1/growth/nft-lab', {
      method: 'POST',
      body: JSON.stringify({ organizationId, ...payload }),
    });
  }

  /**
   * Get Sovereign Wallet & Finance Configuration
   */
  async getWalletConfig(organizationId: string): Promise<TenantWalletConfigDTO> {
    return await this.request<TenantWalletConfigDTO>(`/api/v1/growth/wallet?organizationId=${encodeURIComponent(organizationId)}`);
  }

  /**
   * Update Sovereign Wallet Settings
   */
  async updateWalletConfig(organizationId: string, payload: UpdateTenantWalletRequestDTO): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>('/api/v1/growth/wallet', {
      method: 'POST',
      body: JSON.stringify({ organizationId, ...payload }),
    });
  }

  /**
   * Request Payout Intent (Governed)
   */
  async requestPayout(organizationId: string, payload: { amountUsdc: number; toAddress: string; rationale: string }): Promise<{ success: boolean; intentId: string; message: string }> {
    return await this.request<{ success: boolean; intentId: string; message: string }>('/api/v1/growth/wallet', {
      method: 'POST',
      body: JSON.stringify({ organizationId, payoutRequest: payload }),
    });
  }

  /**
   * Get Growth & Attribution Analytics
   */
  async getAnalytics(organizationId: string): Promise<GetGrowthAnalyticsResponseDTO> {
    return await this.request<GetGrowthAnalyticsResponseDTO>(`/api/v1/growth/analytics?organizationId=${encodeURIComponent(organizationId)}`);
  }

  /**
   * Get Growth Automations & Workflows
   */
  async getAutomations(organizationId: string): Promise<GetAutomationsResponseDTO> {
    return await this.request<GetAutomationsResponseDTO>(`/api/v1/growth/automations?organizationId=${encodeURIComponent(organizationId)}`);
  }
}
