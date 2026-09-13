/**
 * 🕷️ Hermes OS — Governed Web Crawl Tool (F2)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/web/web-crawl-tool.ts
 *
 * Scoped recursive exploration of a tenant's domain:
 * - Strict same-host boundary (never leaves origin hostname)
 * - Absolute hard cap of 50 pages maximum
 * - Per-hop Anti-SSRF validation via EgressGuard
 */

import { EgressGuard } from '../../runtime/egress-guard';
import { WebCrawlInput, WebCrawlResult, WebCrawlPageSummary } from './contracts';
import { WebExtractTool } from './web-extract-tool';

export class WebCrawlTool {
  private static readonly ABSOLUTE_MAX_PAGES = 50;
  private static readonly ABSOLUTE_MAX_DEPTH = 3;

  public static async execute(input: WebCrawlInput): Promise<WebCrawlResult> {
    if (!input.baseUrl || typeof input.baseUrl !== 'string') {
      throw new Error('[WebCrawlTool] baseUrl parameter is required.');
    }

    let parsedBase: URL;
    try {
      parsedBase = new URL(input.baseUrl);
    } catch {
      throw new Error(`[WebCrawlTool] Invalid baseUrl: ${input.baseUrl}`);
    }

    // Validación inicial Anti-SSRF
    const initialCheck = await EgressGuard.validateUrl(input.baseUrl);
    if (!initialCheck.allowed) {
      throw new Error(`[WebCrawlTool] EgressGuard rejected baseUrl: ${initialCheck.reason}`);
    }

    const targetHost = parsedBase.hostname.toLowerCase();
    const maxPages = Math.min(input.maxPages ?? 10, this.ABSOLUTE_MAX_PAGES);
    const maxDepth = Math.min(input.maxDepth ?? 2, this.ABSOLUTE_MAX_DEPTH);

    const visited = new Set<string>();
    const queue: Array<{ url: string; depth: number }> = [{ url: parsedBase.toString(), depth: 0 }];
    const pagesSummary: WebCrawlPageSummary[] = [];
    const brokenLinks: string[] = [];

    while (queue.length > 0 && pagesSummary.length < maxPages) {
      const current = queue.shift()!;
      const normalizedUrl = this.normalizeUrl(current.url);

      if (visited.has(normalizedUrl)) {
        continue;
      }
      visited.add(normalizedUrl);

      // Verificación de seguridad Anti-SSRF por cada página
      const egressCheck = await EgressGuard.validateUrl(normalizedUrl);
      if (!egressCheck.allowed) {
        continue;
      }

      try {
        const extracted = await WebExtractTool.execute({ url: normalizedUrl });
        pagesSummary.push({
          url: normalizedUrl,
          title: extracted.title,
          depth: current.depth,
          linksFound: extracted.links.length,
        });

        // Encolar enlaces internos si no se ha alcanzado la profundidad máxima
        if (current.depth < maxDepth) {
          for (const link of extracted.links) {
            try {
              const linkUrl = new URL(link);
              if (linkUrl.hostname.toLowerCase() === targetHost) {
                const normLink = this.normalizeUrl(link);
                if (!visited.has(normLink)) {
                  queue.push({ url: normLink, depth: current.depth + 1 });
                }
              }
            } catch {
              // Enlace inválido
            }
          }
        }
      } catch (err: any) {
        brokenLinks.push(`${normalizedUrl} (${err.message})`);
      }
    }

    return {
      baseUrl: input.baseUrl,
      pagesCrawled: pagesSummary.length,
      pages: pagesSummary,
      brokenLinksFound: brokenLinks,
    };
  }

  private static normalizeUrl(rawUrl: string): string {
    try {
      const u = new URL(rawUrl);
      u.hash = ''; // Quitar anclas
      return u.toString();
    } catch {
      return rawUrl;
    }
  }
}
