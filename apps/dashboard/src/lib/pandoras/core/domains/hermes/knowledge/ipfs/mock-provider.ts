/**
 * 🌐 Pandora's Sovereign IPFS Stack — Mock In-Memory Provider
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/mock-provider.ts
 */

import crypto from 'crypto';
import { IpfsProvider, IpfsHealthStatus, IpfsProviderType } from './contracts';

export class MockIpfsProvider implements IpfsProvider {
  public readonly providerType: IpfsProviderType = 'MOCK';
  private storage: Map<string, string> = new Map();

  /**
   * Computes a canonical RFC4648 CIDv1 base32 multihash (bafkrei...) for arbitrary JSON or buffer
   */
  public static computeCanonicalCidV1(data: unknown): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest();
    const multihash = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), hash]);
    
    const RFC4648_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (let i = 0; i < multihash.length; i++) {
      value = (value << 8) | (multihash[i] ?? 0);
      bits += 8;
      while (bits >= 5) {
        output += RFC4648_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += RFC4648_ALPHABET[(value << (5 - bits)) & 31];
    }
    return `b${output}`;
  }

  public async pinJson(data: unknown, _name?: string): Promise<string> {
    const cid = MockIpfsProvider.computeCanonicalCidV1(data);
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    this.storage.set(cid, serialized);
    return cid;
  }

  public async fetchJson<T = unknown>(cid: string): Promise<T> {
    const item = this.storage.get(cid);
    if (!item) {
      throw new Error(`[MockIpfsProvider] CID '${cid}' not found in in-memory vault.`);
    }
    return JSON.parse(item) as T;
  }

  public async exists(cid: string): Promise<boolean> {
    return this.storage.has(cid);
  }

  public async healthCheck(): Promise<IpfsHealthStatus> {
    return {
      ok: true,
      providerType: 'MOCK',
      version: 'mock-v1.0.0',
      latencyMs: 0,
    };
  }

  public clear(): void {
    this.storage.clear();
  }
}
