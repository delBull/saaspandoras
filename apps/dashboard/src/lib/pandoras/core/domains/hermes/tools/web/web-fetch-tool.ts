/**
 * 🔒 Hermes OS — Secure Web Fetch Tool (F2)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/web/web-fetch-tool.ts
 *
 * Guaranteed Multi-Layer Defense:
 * - Anti-SSRF through EgressGuard (blocks private networks, cloud metadata, link-local)
 * - SafeHttpClient manual hop-by-hop redirects with destination re-validation
 * - Payload size and strict timeout boundaries
 */

import { SafeHttpClient } from '../../runtime/egress-guard';
import { WebFetchInput, WebFetchResult } from './contracts';

export class WebFetchTool {
  public static async execute(input: WebFetchInput): Promise<WebFetchResult> {
    if (!input.url || typeof input.url !== 'string') {
      throw new Error('[WebFetchTool] URL parameter is required.');
    }

    const timeoutMs = input.timeoutMs ?? 7000;
    const maxSizeBytes = input.maxSizeBytes ?? 5 * 1024 * 1024; // 5 MB

    const response = await SafeHttpClient.fetch(input.url, {
      timeoutMs,
      maxSizeBytes,
      headers: {
        'User-Agent': 'Pandoras-Hermes-Cognitive-OS/2.0 (+https://pandoras.finance/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
      },
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    const body = await response.text();

    const headersRecord: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    return {
      url: input.url,
      status: response.status,
      contentType,
      body,
      headers: headersRecord,
    };
  }
}
