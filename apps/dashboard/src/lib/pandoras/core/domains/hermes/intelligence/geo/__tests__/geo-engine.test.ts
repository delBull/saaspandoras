import { describe, it, expect, beforeEach } from '@jest/globals';
import { GeoCitabilityEngine } from '../geo-citability-engine';
import { HermesToolExecutor } from '../../../runtime/tool-executor';

describe('🌐 Hermes GEO & AI Discoverability Suite (F5)', () => {
  let executor: HermesToolExecutor;

  beforeEach(() => {
    executor = new HermesToolExecutor();
  });

  it('debe auditar robots.txt y detectar permisividad para GPTBot, PerplexityBot y ClaudeBot', () => {
    const permissiveRobots = `
      User-agent: Googlebot
      Disallow: /private/

      User-agent: GPTBot
      Allow: /

      User-agent: PerplexityBot
      Allow: /
    `;

    const report = GeoCitabilityEngine.analyzeRobotsTxt(permissiveRobots);
    expect(report.robotsFound).toBe(true);
    expect(report.allAiBotsBlocked).toBe(false);

    const gpt = report.botPolicies.find(b => b.userAgent === 'GPTBot');
    expect(gpt?.allowed).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(80);
  });

  it('debe penalizar y reportar bloqueo total de IA si robots.txt contiene Disallow con comodín', () => {
    const blockingRobots = `
      User-agent: *
      Disallow: /
    `;

    const report = GeoCitabilityEngine.analyzeRobotsTxt(blockingRobots);
    expect(report.allAiBotsBlocked).toBe(true);
    expect(report.score).toBe(0);
  });

  it('debe validar llms.txt y detectar estructura Markdown correcta con enlaces canónicos', () => {
    const validLlmsTxt = `
      # S'Narai Eco-Luxury Villas
      > Certificados de participación inmobiliaria en Tulum.

      ## Documentación
      - [Portal Oficial](https://snarai.com): Información general y deal room.
    `;

    const report = GeoCitabilityEngine.analyzeLlmsTxt(validLlmsTxt);
    expect(report.present).toBe(true);
    expect(report.hasH1Title).toBe(true);
    expect(report.hasCanonicalLinks).toBe(true);
    expect(report.isValidMarkdown).toBe(true);
  });

  it('debe contar hechos atómicos cuantitativos (porcentajes, montos, métricas)', () => {
    const text = "S'Narai cuenta con 24 unidades exclusivas en Tulum. Ofrece 15% de rendimiento anual estimado con tickets desde $50,000 USD.";
    const count = GeoCitabilityEngine.countAtomicFacts(text);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('debe generar un archivo llms.txt estructurado listo para producción', () => {
    const llmsTxt = GeoCitabilityEngine.generateLlmsTxt({
      title: "S'Narai Riviera Maya",
      description: "Desarrollo tokenizado de lujo sustentable.",
      url: "https://snarai.com",
      factsCount: 8,
    });

    expect(llmsTxt).toContain("# S'Narai Riviera Maya");
    expect(llmsTxt).toContain('https://snarai.com/dealroom');
    expect(llmsTxt).toContain('Total de aseveraciones verificadas en vault: 8');
  });

  it('TOOL GATEWAY: debe ejecutar seo.geo a través de HermesToolExecutor', async () => {
    const response = await executor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'actor_marco',
        capabilityId: 'web.extract',
        toolName: 'seo.geo',
        parameters: { url: 'https://snarai.com' },
      },
      [{ id: 'web.extract' }]
    );

    expect(response.success).toBe(true);
    expect((response.data as any).citabilityScore).toBeGreaterThanOrEqual(0);
  });
});
