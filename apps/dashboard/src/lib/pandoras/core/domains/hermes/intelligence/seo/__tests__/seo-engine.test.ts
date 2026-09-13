import { describe, it, expect, beforeEach } from '@jest/globals';
import { SeoAuditEngine } from '../seo-audit-engine';
import { SeoContentEngine } from '../seo-content-engine';
import { SeoSchemaEngine } from '../seo-schema-engine';
import { SeoCompetitorEngine } from '../seo-competitor-engine';
import { HermesToolExecutor } from '../../../runtime/tool-executor';

describe('🎯 Hermes SEO Intelligence Engine Suite (F4)', () => {
  let executor: HermesToolExecutor;

  beforeEach(() => {
    executor = new HermesToolExecutor();
  });

  const validHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>S'Narai — Fracciones Inmobiliarias y Villas de Lujo en Tulum</title>
        <meta name="description" content="Invierte en villas de lujo sustentables con rendimientos en dólares y título en blockchain en Tulum.">
        <link rel="canonical" href="https://snarai.com/dealroom">
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": "S'Narai Eco-Luxury Villas",
            "priceCurrency": "USD"
          }
        </script>
      </head>
      <body>
        <main>
          <h1>Oportunidad de Inversión Inmobiliaria S'Narai</h1>
          <p>Desarrollo ecológico de alta plusvalía en la Riviera Maya con tokenización de activos reales RWA.</p>
          <h2>Modelo Financiero y Rendimientos</h2>
          <p>Retornos proyectados basados en ocupación hotelera y apreciación de capital.</p>
          <h2>Ubicación Privilegiada</h2>
          <p>En el corazón de Tulum, conectado con la selva y el mar caribe.</p>
        </main>
      </body>
    </html>
  `;

  // ── 1. SEO AUDIT ENGINE ────────────────────────────────────────────────
  describe('🛠️ SeoAuditEngine', () => {
    it('debe calcular healthScore alto y 0 issues críticos en documento bien optimizado', async () => {
      const report = await SeoAuditEngine.analyze({ html: validHtml, url: 'https://snarai.com/dealroom' });

      expect(report.healthScore).toBeGreaterThanOrEqual(90);
      expect(report.title).toBe("S'Narai — Fracciones Inmobiliarias y Villas de Lujo en Tulum");
      expect(report.metrics.h1Count).toBe(1);
      expect(report.metrics.h2Count).toBe(2);
      expect(report.metrics.jsonLdBlocksCount).toBe(1);

      const criticalIssues = report.issues.filter(i => i.severity === 'CRITICAL');
      expect(criticalIssues.length).toBe(0);
    });

    it('debe penalizar drásticamente y detectar fallas críticas (sin title, sin H1, con noindex)', async () => {
      const badHtml = `
        <html>
          <head>
            <meta name="robots" content="noindex, nofollow">
          </head>
          <body>
            <p>Texto sin estructura jerárquica.</p>
          </body>
        </html>
      `;

      const report = await SeoAuditEngine.analyze({ html: badHtml, url: 'https://bad-example.com' });

      expect(report.healthScore).toBeLessThan(40);
      const codes = report.issues.map(i => i.code);
      expect(codes).toContain('MISSING_TITLE');
      expect(codes).toContain('NOINDEX_DETECTED');
      expect(codes).toContain('MISSING_H1');
      expect(report.recommendations.length).toBeGreaterThan(2);
    });
  });

  // ── 2. SEO CONTENT ENGINE ──────────────────────────────────────────────
  describe('📝 SeoContentEngine', () => {
    it('debe analizar legibilidad, densidad de keywords y entidades del sector', async () => {
      const report = await SeoContentEngine.analyze({
        html: validHtml,
        url: 'https://snarai.com/dealroom',
        targetKeywords: ['tokenización', 'tulum', 'rendimientos'],
      });

      expect(report.wordCount).toBeGreaterThan(20);
      expect(report.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(report.readingEaseLevel).toBeDefined();

      // Entidades descubiertas
      expect(report.discoveredEntities).toContain('tokenización');
      expect(report.discoveredEntities).toContain('tulum');
      expect(report.discoveredEntities).toContain('rwa');

      // Keywords analizadas
      const tulumKw = report.targetKeywordAnalysis.find(k => k.keyword === 'tulum');
      expect(tulumKw).toBeDefined();
      expect(tulumKw?.occurrences).toBeGreaterThanOrEqual(1);
    });
  });

  // ── 3. SEO SCHEMA ENGINE ───────────────────────────────────────────────
  describe('🏛️ SeoSchemaEngine', () => {
    it('debe validar bloques Schema.org existentes y reconocer RealEstateListing', async () => {
      const report = await SeoSchemaEngine.analyze({ html: validHtml, url: 'https://snarai.com/dealroom' });

      expect(report.schemasFound).toContain('RealEstateListing');
      expect(report.hasRealEstateSchema).toBe(true);
      expect(report.validationErrors.length).toBe(0);
    });

    it('debe generar bloque Schema.org recomendado si la página carece de datos estructurados', async () => {
      const emptyHtml = '<html><head><title>Villa Sin Schema</title></head><body><h1>Hola</h1></body></html>';
      const report = await SeoSchemaEngine.analyze({ html: emptyHtml, url: 'https://snarai.com/noschema' });

      expect(report.hasRealEstateSchema).toBe(false);
      expect(report.recommendedJsonLd).toBeDefined();
      expect((report.recommendedJsonLd as any)['@type']).toBe('RealEstateListing');
    });
  });

  // ── 4. SEO COMPETITOR ENGINE ───────────────────────────────────────────
  describe('⚔️ SeoCompetitorEngine', () => {
    it('debe comparar el tenant contra competidores y generar directivas de Growth OS', async () => {
      const competitorHtml = '<html><head><title>Competidor Débil</title></head><body><p>Poco texto.</p></body></html>';

      // Mockeamos la extracción con HTML inline a través del objeto
      const report = await SeoCompetitorEngine.analyze({
        tenantUrl: 'https://snarai.com/dealroom',
        competitorUrls: ['https://competitor-alpha.com/deal'],
        targetTopics: ['Villas en Tulum', 'Tokenización RWA'],
      });

      expect(report.tenantUrl).toBe('https://snarai.com/dealroom');
      expect(report.competitors.length).toBe(1);
      expect(report.growthOsDirectives.length).toBeGreaterThan(0);
    });
  });

  // ── 5. HERMES TOOL EXECUTOR INTEGRATION ────────────────────────────────
  describe('🏛️ HermesToolExecutor Integration', () => {
    it('debe ejecutar seo.audit mediante HermesToolExecutor con autorización de capability', async () => {
      const response = await executor.executeTool(
        {
          organizationId: 'snarai',
          actorId: 'actor_marco',
          capabilityId: 'web.extract',
          toolName: 'seo.audit',
          parameters: { html: validHtml },
        },
        [{ id: 'web.extract' }]
      );

      expect(response.success).toBe(true);
      expect((response.data as any).healthScore).toBeGreaterThanOrEqual(90);
    });
  });
});
