/**
 * 🌐 Pandora's Sovereign IPFS Stack — Kubo RPC Provider
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/kubo-provider.ts
 *
 * Communicates with Pandora's self-hosted Kubo IPFS Node / IPFS Cluster.
 * Enforces authenticated RPC boundary and Gateway.NoFetch support.
 */

import { IpfsProvider, IpfsHealthStatus, IpfsProviderType } from './contracts';
import { SafeHttpClient } from '../../runtime/egress-guard';

export interface KuboProviderOptions {
  rpcUrl?: string;
  gatewayUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class KuboRpcIpfsProvider implements IpfsProvider {
  public readonly providerType: IpfsProviderType = 'KUBO';
  private rpcUrl: string;
  private gatewayUrl: string;
  private apiKey?: string;
  private timeoutMs: number;

  constructor(options?: KuboProviderOptions) {
    this.rpcUrl = (options?.rpcUrl || process.env.PANDORAS_KUBO_RPC_URL || 'http://127.0.0.1:5001').replace(/\/$/, '');
    this.gatewayUrl = (options?.gatewayUrl || process.env.PANDORAS_KUBO_GATEWAY_URL || 'http://127.0.0.1:8080/ipfs').replace(/\/$/, '');
    this.apiKey = options?.apiKey || process.env.PANDORAS_KUBO_API_KEY;
    this.timeoutMs = options?.timeoutMs || 15000;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['X-API-Key'] = this.apiKey;
    }
    return headers;
  }

  /**
   * Pins JSON data to Kubo via /api/v0/add?cid-version=1&pin=true
   */
  public async pinJson(data: unknown, name?: string): Promise<string> {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const formData = new FormData();
    const blob = new Blob([content], { type: 'application/json' });
    formData.append('file', blob, name || 'hermes-artifact.json');

    const url = `${this.rpcUrl}/api/v0/add?cid-version=1&pin=true&quieter=true`;
    const headers = this.getAuthHeaders();

    const response = await SafeHttpClient.fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      timeoutMs: this.timeoutMs,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown RPC Error');
      throw new Error(`[KuboRpcIpfsProvider] Failed to pin JSON (status ${response.status}): ${errorText}`);
    }

    const result = await response.json() as { Hash?: string };
    if (!result.Hash) {
      throw new Error('[KuboRpcIpfsProvider] Kubo RPC add response did not include a valid Hash.');
    }

    return result.Hash;
  }

  /**
   * Fetches JSON content from Kubo via /api/v0/cat or Gateway
   */
  public async fetchJson<T = unknown>(cid: string): Promise<T> {
    // 1. Try Kubo RPC /api/v0/cat first
    try {
      const catUrl = `${this.rpcUrl}/api/v0/cat?arg=${encodeURIComponent(cid)}`;
      const catRes = await SafeHttpClient.fetch(catUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        timeoutMs: this.timeoutMs,
      });

      if (catRes.ok) {
        return await catRes.json() as T;
      }
    } catch {
      // Fall through to Gateway attempt
    }

    // 2. Try Kubo HTTP Gateway
    try {
      const gwUrl = `${this.gatewayUrl}/${encodeURIComponent(cid)}`;
      const gwRes = await SafeHttpClient.fetch(gwUrl, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'Accept': 'application/json',
        },
        timeoutMs: this.timeoutMs,
      });

      if (gwRes.ok) {
        return await gwRes.json() as T;
      }
    } catch {
      // Throw unified error
    }

    throw new Error(`[KuboRpcIpfsProvider] Failed to retrieve content from Kubo for CID: ${cid}`);
  }

  /**
   * Checks if CID is pinned locally on Kubo
   */
  public async exists(cid: string): Promise<boolean> {
    try {
      const url = `${this.rpcUrl}/api/v0/pin/ls?arg=${encodeURIComponent(cid)}&type=all`;
      const res = await SafeHttpClient.fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        timeoutMs: 5000,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Health check against Kubo /api/v0/version
   */
  public async healthCheck(): Promise<IpfsHealthStatus> {
    const start = Date.now();
    try {
      const url = `${this.rpcUrl}/api/v0/version`;
      const res = await SafeHttpClient.fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        timeoutMs: 5000,
      });

      const latencyMs = Date.now() - start;

      if (res.ok) {
        const body = await res.json() as { Version?: string };
        return {
          ok: true,
          providerType: 'KUBO',
          version: body.Version || 'unknown',
          latencyMs,
        };
      }

      return {
        ok: false,
        providerType: 'KUBO',
        latencyMs,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    } catch (err: any) {
      return {
        ok: false,
        providerType: 'KUBO',
        latencyMs: Date.now() - start,
        error: err?.message || 'Connection failed',
      };
    }
  }
}
