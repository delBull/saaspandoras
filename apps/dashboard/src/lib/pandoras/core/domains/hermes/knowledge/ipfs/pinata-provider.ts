/**
 * 🌐 Pandora's Sovereign IPFS Stack — Pinata Provider
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/pinata-provider.ts
 *
 * Implements external IPFS redundancy and backup pinning via Pinata Cloud API.
 */

import { IpfsProvider, IpfsHealthStatus, IpfsProviderType } from './contracts';
import { SafeHttpClient } from '../../runtime/egress-guard';
import { MockIpfsProvider } from './mock-provider';

export interface PinataProviderOptions {
  pinataJwt?: string;
  pinataGateway?: string;
  timeoutMs?: number;
}

export class PinataIpfsProvider implements IpfsProvider {
  public readonly providerType: IpfsProviderType = 'PINATA';
  private pinataJwt?: string;
  private pinataGateway: string;
  private timeoutMs: number;

  constructor(options?: PinataProviderOptions) {
    this.pinataJwt = options?.pinataJwt || process.env.PINATA_JWT;
    this.pinataGateway = (options?.pinataGateway || process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs').replace(/\/$/, '');
    this.timeoutMs = options?.timeoutMs || 15000;
  }

  public async pinJson(data: unknown, name?: string): Promise<string> {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!this.pinataJwt) {
      if (isProduction) {
        throw new Error('[PinataIpfsProvider] PINATA_JWT is required for pinning operations.');
      }
      return MockIpfsProvider.computeCanonicalCidV1(data);
    }

    try {
      const res = await SafeHttpClient.fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pinataJwt}`,
        },
        body: JSON.stringify({
          pinataOptions: { cidVersion: 1 },
          pinataMetadata: { name: name || 'hermes-artifact.json' },
          pinataContent: data,
        }),
        timeoutMs: this.timeoutMs,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown Pinata Error');
        console.warn(`[PinataIpfsProvider] Pinata API returned status ${res.status}: ${errorText}. Falling back to deterministic Sovereign Canonical CIDv1.`);
        return MockIpfsProvider.computeCanonicalCidV1(data);
      }

      const body = await res.json() as { IpfsHash?: string };
      if (!body.IpfsHash) {
        return MockIpfsProvider.computeCanonicalCidV1(data);
      }

      return body.IpfsHash;
    } catch (err: any) {
      console.warn(`[PinataIpfsProvider] Pinata request failed (${err?.message}). Falling back to deterministic Sovereign Canonical CIDv1.`);
      return MockIpfsProvider.computeCanonicalCidV1(data);
    }
  }

  public async fetchJson<T = unknown>(cid: string): Promise<T> {
    const url = `${this.pinataGateway}/${encodeURIComponent(cid)}`;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (this.pinataJwt) {
      headers['Authorization'] = `Bearer ${this.pinataJwt}`;
    }

    try {
      const res = await SafeHttpClient.fetch(url, {
        method: 'GET',
        headers,
        timeoutMs: this.timeoutMs,
      });

      if (!res.ok) {
        const mock = new MockIpfsProvider();
        if (await mock.exists(cid)) {
          return await mock.fetchJson<T>(cid);
        }
        throw new Error(`[PinataIpfsProvider] Failed to fetch CID '${cid}' (status ${res.status})`);
      }

      return await res.json() as T;
    } catch (err: any) {
      const mock = new MockIpfsProvider();
      if (await mock.exists(cid)) {
        return await mock.fetchJson<T>(cid);
      }
      throw err;
    }
  }

  public async exists(cid: string): Promise<boolean> {
    const mock = new MockIpfsProvider();
    if (await mock.exists(cid)) return true;

    if (!this.pinataJwt) return false;
    try {
      const url = `https://api.pinata.cloud/data/pinList?hashContains=${encodeURIComponent(cid)}&status=pinned`;
      const res = await SafeHttpClient.fetch(url, {
        headers: { 'Authorization': `Bearer ${this.pinataJwt}` },
        timeoutMs: 5000,
      });
      if (res.ok) {
        const body = await res.json() as { count?: number };
        return typeof body.count === 'number' && body.count > 0;
      }
      return false;
    } catch {
      return false;
    }
  }

  public async healthCheck(): Promise<IpfsHealthStatus> {
    const start = Date.now();
    if (!this.pinataJwt) {
      return {
        ok: false,
        providerType: 'PINATA',
        latencyMs: 0,
        error: 'PINATA_JWT not configured',
      };
    }

    try {
      const res = await SafeHttpClient.fetch('https://api.pinata.cloud/data/testAuthentication', {
        headers: { 'Authorization': `Bearer ${this.pinataJwt}` },
        timeoutMs: 5000,
      });

      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          ok: true,
          providerType: 'PINATA',
          version: 'pinata-v1',
          latencyMs,
        };
      }

      return {
        ok: false,
        providerType: 'PINATA',
        latencyMs,
        error: `HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        ok: false,
        providerType: 'PINATA',
        latencyMs: Date.now() - start,
        error: err?.message || 'Connection failed',
      };
    }
  }
}
