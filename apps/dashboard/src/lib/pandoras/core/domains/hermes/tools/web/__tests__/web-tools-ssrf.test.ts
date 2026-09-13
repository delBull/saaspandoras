import { describe, it, expect, beforeEach } from '@jest/globals';
import { WebFetchTool } from '../web-fetch-tool';
import { WebExtractTool } from '../web-extract-tool';
import { WebSearchTool, MockWebSearchProvider } from '../web-search-provider';
import { WebCrawlTool } from '../web-crawl-tool';
import { HermesToolExecutor } from '../../../runtime/tool-executor';

describe('🌐 Hermes Web Intelligence & Anti-SSRF Defense Suite (F2)', () => {
  let executor: HermesToolExecutor;

  beforeEach(() => {
    executor = new HermesToolExecutor();
    WebSearchTool.setProvider(new MockWebSearchProvider());
  });

  // ── 1. ANTI-SSRF HARD DEFENSE ──────────────────────────────────────────
  describe('🛡️ EgressGuard Anti-SSRF Hard Boundaries', () => {
    it('debe bloquear tajantemente intentos contra Cloud Metadata (169.254.169.254)', async () => {
      await expect(
        WebFetchTool.execute({ url: 'http://169.254.169.254/latest/meta-data' })
      ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);
    });

    it('debe bloquear intentos contra localhost y 127.0.0.1', async () => {
      await expect(
        WebFetchTool.execute({ url: 'http://localhost:3000/api/secrets' })
      ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);

      await expect(
        WebFetchTool.execute({ url: 'http://127.0.0.1:8080/internal' })
      ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);
    });

    it('debe bloquear intentos contra redes privadas RFC1918 (10.x, 192.168.x)', async () => {
      await expect(
        WebFetchTool.execute({ url: 'http://10.0.0.1/admin' })
      ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);

      await expect(
        WebFetchTool.execute({ url: 'http://192.168.1.100/router' })
      ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);
    });

    it('debe bloquear URLs con credenciales embebidas user:pass', async () => {
      await expect(
        WebFetchTool.execute({ url: 'http://admin:supersecret@example.com' })
      ).rejects.toThrow(/EMBEDDED_CREDENTIALS_FORBIDDEN/i);
    });

    it('debe bloquear IPs ofuscadas en formato hexadecimal', async () => {
      await expect(
        WebFetchTool.execute({ url: 'http://0x7f000001/status' })
      ).rejects.toThrow(/OBFUSCATED_IP_FORBIDDEN/i);
    });
  });

  // ── 2. WEB EXTRACT TOOL & SCHEMA.ORG ───────────────────────────────────
  describe('📰 WebExtractTool Parser & Structured Extraction', () => {
    it('debe extraer metadatos, jerarquía H1-H3, enlaces y JSON-LD de un documento HTML', async () => {
      const sampleHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>S'Narai — Fracciones Inmobiliarias en Tulum</title>
            <meta name="description" content="Invierte en villas de lujo sustentables con rendimientos en dólares y título en blockchain.">
            <link rel="canonical" href="https://snarai.com/dealroom">
            <meta name="robots" content="index, follow">
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "RealEstateListing",
                "name": "Villa Coral S'Narai",
                "priceCurrency": "USD"
              }
            </script>
          </head>
          <body>
            <nav><a href="/home">Ignorar Nav</a></nav>
            <header>Banner</header>
            <main>
              <h1>Oportunidad de Inversión S'Narai</h1>
              <p>Desarrollo ecológico de alta plusvalía en la Riviera Maya.</p>
              <h2>Detalles del Proyecto</h2>
              <p>Ubicación privilegiada en Región 15.</p>
              <h3>Rendimientos Estimados</h3>
              <p>12% a 15% anual.</p>
              <a href="/checkout/fundador">Adquirir Certificado</a>
              <a href="https://pandoras.finance">Ecosistema Pandoras</a>
            </main>
            <footer>Pie de página</footer>
          </body>
        </html>
      `;

      const result = WebExtractTool.parseHtml(sampleHtml, 'https://snarai.com/dealroom');

      expect(result.title).toBe("S'Narai — Fracciones Inmobiliarias en Tulum");
      expect(result.metaDescription).toBe("Invierte en villas de lujo sustentables con rendimientos en dólares y título en blockchain.");
      expect(result.canonicalUrl).toBe("https://snarai.com/dealroom");
      expect(result.metaRobots).toBe("index, follow");

      // Encabezados
      expect(result.headings.h1).toEqual(["Oportunidad de Inversión S'Narai"]);
      expect(result.headings.h2).toEqual(["Detalles del Proyecto"]);
      expect(result.headings.h3).toEqual(["Rendimientos Estimados"]);

      // JSON-LD
      expect(result.jsonLd.length).toBe(1);
      expect((result.jsonLd[0] as any)['@type']).toBe('RealEstateListing');

      // Enlaces resueltos
      expect(result.links).toContain('https://snarai.com/checkout/fundador');
      expect(result.links).toContain('https://pandoras.finance/');

      // Markdown sin basura de nav/footer/script
      expect(result.markdown).toContain("# Oportunidad de Inversión S'Narai");
      expect(result.markdown).toContain("## Detalles del Proyecto");
      expect(result.markdown).not.toContain('Pie de página');
      expect(result.markdown).not.toContain('Ignorar Nav');
    });
  });

  // ── 3. WEB SEARCH TOOL ────────────────────────────────────────────────
  describe('🔎 WebSearchTool & Providers', () => {
    it('debe ejecutar búsquedas estructuradas respetando el límite de resultados', async () => {
      const result = await WebSearchTool.execute({
        query: 'tokenización inmobiliaria en México',
        limit: 2,
      });

      expect(result.query).toBe('tokenización inmobiliaria en México');
      expect(result.results.length).toBe(2);
      expect(result.results[0]?.title).toBeDefined();
      expect(result.results[0]?.url).toBeDefined();
      expect(result.provider).toBe('mock_search');
    });
  });

  // ── 4. WEB CRAWL TOOL LIMITS ──────────────────────────────────────────
  describe('🕷️ WebCrawlTool Scoped Boundaries', () => {
    it('debe rechazar de inmediato un baseUrl dirigido a IPs prohibidas (SSRF fail-closed)', async () => {
      await expect(
        WebCrawlTool.execute({ baseUrl: 'http://169.254.169.254/crawling' })
      ).rejects.toThrow(/EgressGuard rejected baseUrl/i);

      await expect(
        WebCrawlTool.execute({ baseUrl: 'http://192.168.1.1' })
      ).rejects.toThrow(/EgressGuard rejected baseUrl/i);
    });
  });

  // ── 5. INTEGRACIÓN TOTAL CON HERMES TOOL EXECUTOR & GATE ──────────────
  describe('🏛️ ToolAuthorizationGate & HermesToolExecutor Integration', () => {
    it('debe permitir web.extract si el tenant tiene la capability activa', async () => {
      const sampleHtml = '<html><head><title>Test Doc</title></head><body><h1>Hello World</h1></body></html>';

      const response = await executor.executeTool(
        {
          organizationId: 'snarai',
          actorId: 'actor_marco',
          capabilityId: 'web.extract',
          toolName: 'web.extract',
          parameters: { html: sampleHtml },
        },
        [{ id: 'web.extract' }]
      );

      expect(response.success).toBe(true);
      expect((response.data as any).title).toBe('Test Doc');
      expect((response.data as any).headings.h1).toEqual(['Hello World']);
    });

    it('debe DENEGAR web.search si el tenant NO tiene la capability activa', async () => {
      const response = await executor.executeTool(
        {
          organizationId: 'snarai',
          actorId: 'actor_marco',
          capabilityId: 'web.search',
          toolName: 'web.search',
          parameters: { query: 'competencia' },
        },
        [{ id: 'payments.create_spei_link' }] // Solo tiene pagos, no búsqueda
      );

      expect(response.success).toBe(false);
      expect(response.unauthorized).toBe(true);
      expect(response.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
      expect(response.reason).toContain("not enabled for tenant 'snarai'");
    });

    it('debe DENEGAR web.fetch mediante el firewall si la URL en parameters es un objetivo SSRF', async () => {
      const response = await executor.executeTool(
        {
          organizationId: 'snarai',
          actorId: 'actor_marco',
          capabilityId: 'web.extract',
          toolName: 'web.fetch',
          parameters: { url: 'http://169.254.169.254/secrets' },
        },
        [{ id: 'web.extract' }]
      );

      expect(response.success).toBe(false);
      expect(response.unauthorized).toBe(true);
      expect(response.reason).toContain('Egress Firewall Blocked');
    });
  });
});
