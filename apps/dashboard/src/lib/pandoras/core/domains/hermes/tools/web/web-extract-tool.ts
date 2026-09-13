/**
 * 📰 Hermes OS — Secure Web Extract Tool (F2)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/web/web-extract-tool.ts
 *
 * Extracts structured semantic content, meta tags, Schema.org JSON-LD and clean Markdown.
 */

import { WebExtractInput, WebExtractResult } from './contracts';
import { WebFetchTool } from './web-fetch-tool';

export class WebExtractTool {
  public static async execute(input: WebExtractInput): Promise<WebExtractResult> {
    let rawHtml = input.html || '';
    let targetUrl = input.url || 'http://local.document';

    if (!rawHtml && input.url) {
      const fetched = await WebFetchTool.execute({ url: input.url });
      rawHtml = fetched.body;
      targetUrl = fetched.url;
    }

    if (!rawHtml) {
      throw new Error('[WebExtractTool] Either url or html must be provided.');
    }

    return this.parseHtml(rawHtml, targetUrl);
  }

  public static parseHtml(html: string, pageUrl: string): WebExtractResult {
    // 1. Extraer Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch && titleMatch[1] ? this.decodeHtmlEntities(titleMatch[1].trim()) : '';

    // 2. Extraer Meta Description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    const metaDescription = descMatch && descMatch[1] ? this.decodeHtmlEntities(descMatch[1].trim()) : undefined;

    // 3. Extraer Canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i)
      || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
    const canonicalUrl = canonicalMatch && canonicalMatch[1] ? canonicalMatch[1].trim() : undefined;

    // 4. Extraer Meta Robots
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["'][^>]*>/i);
    const metaRobots = robotsMatch && robotsMatch[1] ? robotsMatch[1].trim() : undefined;

    // 5. Extraer Bloques JSON-LD
    const jsonLd: unknown[] = [];
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jsonMatch: RegExpExecArray | null;
    while ((jsonMatch = jsonLdRegex.exec(html)) !== null) {
      if (jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          jsonLd.push(parsed);
        } catch {
          // Bloque JSON malformado se omite de forma segura
        }
      }
    }

    // 6. Extraer Encabezados H1, H2, H3
    const headings = {
      h1: this.extractHeadings(html, 'h1'),
      h2: this.extractHeadings(html, 'h2'),
      h3: this.extractHeadings(html, 'h3'),
    };

    // 7. Extraer Links
    const links: string[] = [];
    const linkRegex = /<a[^>]*href=["']([^"'#][^"']*)["'][^>]*>/gi;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      if (linkMatch[1]) {
        const rawHref = linkMatch[1].trim();
        try {
          const resolved = new URL(rawHref, pageUrl).toString();
          if (!links.includes(resolved)) {
            links.push(resolved);
          }
        } catch {
          // Enlace relativo inválido
        }
      }
    }

    // 8. Limpiar Contenido para Markdown y Texto
    // Remover elementos irrelevantes: scripts, styles, noscript, nav, footer, header
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // Convertir encabezados
    clean = clean.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
    clean = clean.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
    clean = clean.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
    clean = clean.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

    // Convertir listas
    clean = clean.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');

    // Convertir párrafos y saltos
    clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');
    clean = clean.replace(/<br\s*\/?>/gi, '\n');

    // Quitar todas las etiquetas HTML restantes
    clean = clean.replace(/<[^>]+>/g, ' ');

    // Decodificar entidades y compactar espacios
    const markdown = this.decodeHtmlEntities(clean)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n\n');

    const text = markdown.replace(/[#*\-`_]/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      url: pageUrl,
      title,
      metaDescription,
      canonicalUrl,
      metaRobots,
      text,
      markdown,
      headings,
      jsonLd,
      links,
    };
  }

  private static extractHeadings(html: string, tag: 'h1' | 'h2' | 'h3'): string[] {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    const results: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      if (match[1]) {
        const text = this.decodeHtmlEntities(match[1].replace(/<[^>]+>/g, '').trim());
        if (text && !results.includes(text)) {
          results.push(text);
        }
      }
    }
    return results;
  }

  private static decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
}
