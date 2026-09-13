/**
 * 📚 Hermes OS — Canonical Skill Catalog (F1)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/skills/catalog.ts
 *
 * Pre-instantiates standard Search, Web Intelligence and SEO Skills
 * adhering to procedural knowledge standards and progressive disclosure.
 */

import { HermesSkillDefinition } from './contracts';
import { HermesSkillRegistry } from './registry';

export const CANONICAL_SKILLS: HermesSkillDefinition[] = [
  // ── 1. SEO AUDIT (Technical & On-Page) ──────────────────────────────────
  {
    id: 'seo.audit',
    version: '1.0.0',
    name: 'Auditoría Técnica y On-Page',
    description: 'Evalúa la salud técnica, meta tags, Core Web Vitals heurísticos, enlaces y estructura jerárquica de una URL.',
    category: 'SEO',
    requiredCapabilities: ['web.extract'],
    requiredTools: ['web.fetch', 'web.extract'],
    executionClass: 'ANALYZE',
    riskClass: 'LOW',
    produces: 'EVIDENCE',
    tenantScoped: true,
    governance: { approvalRequired: false },
    inputsSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string', format: 'uri' },
        depth: { type: 'number', default: 1 },
      },
      required: ['targetUrl'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        statusCode: { type: 'number' },
        title: { type: 'string' },
        metaDescription: { type: 'string' },
        canonicalUrl: { type: 'string' },
        headings: { type: 'object' },
        brokenLinks: { type: 'array', items: { type: 'string' } },
        healthScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
    procedure: `
# Procedimiento: Auditoría Técnica y On-Page (seo.audit)

## Contexto & Objetivos
Auditar una URL para identificar fallas técnicas que impidan el rastreo, indexación o correcta interpretación por motores de búsqueda tradicionales y agentes autónomos.

## Precondiciones
1. La URL debe superar la validación Anti-SSRF de \`EgressGuard\` (sin IPs privadas, loopback ni metadata).
2. El tenant debe tener asignada la capability \`web.extract\`.

## Pasos Operativos
1. **Fetch Seguro**: Solicitar al Tool Gateway la obtención del HTML crudo usando \`web.fetch\` con \`SafeHttpClient\`.
2. **Extracción Estructural**: Extraer mediante \`web.extract\`:
   - Title tag (verificar longitud: 45-65 caracteres).
   - Meta description (verificar longitud: 120-160 caracteres).
   - Directivas meta robots (\`noindex\`, \`nofollow\`, etc.).
   - Canonical link tag (verificar si coincide con la URL consultada).
   - Jerarquía H1-H6 (verificar existencia de exactamente un H1 principal).
   - Enlaces internos y salientes.
3. **Análisis de Enlaces**: Comprobar status HTTP de enlaces salientes para detectar errores 404/500.
4. **Cálculo de Health Score**: Ponderar penalizaciones por fallas críticas (ej. falta de H1, title ausente, meta robots restrictivo accidental).
5. **Generación de Evidencia**: Empaquetar el reporte estructurado para ser almacenado en el Vault del tenant.

## Pitfalls Comunes
- Páginas con renderizado del lado del cliente (SPA) que requieren la herramienta \`web.browser\` en lugar de \`web.fetch\` estático.
- URLs con redirecciones múltiples que exceden el límite de seguridad (máximo 3 saltos).
`.trim(),
  },

  // ── 2. SEO CONTENT (Semantic Quality & Coverage) ───────────────────────
  {
    id: 'seo.content',
    version: '1.0.0',
    name: 'Análisis Semántico y Calidad de Contenido',
    description: 'Evalúa la profundidad temática, entidades semánticas, legibilidad y relevancia frente a la intención de búsqueda.',
    category: 'SEO',
    requiredCapabilities: ['web.extract'],
    requiredTools: ['web.extract'],
    executionClass: 'ANALYZE',
    riskClass: 'LOW',
    produces: 'EVIDENCE',
    tenantScoped: true,
    governance: { approvalRequired: false },
    inputsSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string' },
        targetKeywords: { type: 'array', items: { type: 'string' } },
      },
      required: ['targetUrl'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        wordCount: { type: 'number' },
        readabilityScore: { type: 'number' },
        extractedEntities: { type: 'array', items: { type: 'string' } },
        semanticCoveragePercent: { type: 'number' },
        contentGaps: { type: 'array', items: { type: 'string' } },
      },
    },
    procedure: `
# Procedimiento: Análisis Semántico y Calidad de Contenido (seo.content)

## Contexto & Objetivos
Determinar si el contenido textual de una página satisface la intención de búsqueda y cubre las entidades semánticas clave del sector (ej. RWA, Tokenización, Bienes Raíces).

## Pasos Operativos
1. **Extracción Limpia**: Invocación de \`web.extract\` para aislar el cuerpo principal del artículo/landing (removiendo headers, footers, navs y scripts).
2. **Métricas de Texto**:
   - Conteo neto de palabras útiles.
   - Índice de legibilidad Flesch-Szigriszt (adaptado al español).
3. **Mapeo de Entidades**: Identificar conceptos nodales (marcas, regulaciones, tipologías de activos, beneficios).
4. **Análisis de Brechas (Content Gap)**: Comparar las entidades presentes contra el vocabulario ontológico del proyecto en el Knowledge Vault.
5. **Recomendaciones Editoriales**: Sugerir subtemas o secciones faltantes para enriquecer la cobertura semántica.
`.trim(),
  },

  // ── 3. SEO SCHEMA (Structured Data & Entity Graph) ─────────────────────
  {
    id: 'seo.schema',
    version: '1.0.0',
    name: 'Auditoría de Datos Estructurados (Schema.org)',
    description: 'Inspecciona, valida y detecta omisiones de marcado semántico Schema.org (JSON-LD y Microdata).',
    category: 'SEO',
    requiredCapabilities: ['web.extract'],
    requiredTools: ['web.extract'],
    executionClass: 'READ',
    riskClass: 'LOW',
    produces: 'DATA',
    tenantScoped: true,
    governance: { approvalRequired: false },
    inputsSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string' },
      },
      required: ['targetUrl'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        schemasFound: { type: 'array', items: { type: 'string' } },
        jsonLdBlocks: { type: 'array' },
        validationErrors: { type: 'array', items: { type: 'string' } },
        recommendedSchemas: { type: 'array', items: { type: 'string' } },
      },
    },
    procedure: `
# Procedimiento: Auditoría de Datos Estructurados (seo.schema)

## Contexto & Objetivos
Garantizar que motores de búsqueda y modelos de lenguaje comprendan inequívocamente las entidades (Organización, Oferta Inmobiliaria, FAQ, Producto) a través de JSON-LD.

## Pasos Operativos
1. **Extracción de Bloques**: Buscar todas las etiquetas \`<script type="application/ld+json">\` y microdata en el documento.
2. **Validación de Sintaxis**: Parsear cada bloque JSON. Reportar errores de sintaxis o anidación inválida.
3. **Comprobación de Tipos**:
   - Verificar propiedades obligatorias según Schema.org (\`@context\`, \`@type\`, \`name\`, \`url\`).
   - Si es Real Estate: verificar \`RealEstateListing\`, \`Accommodation\`, \`priceCurrency\`, \`geo\`.
   - Si es Organización/Finanzas: verificar \`FinancialProduct\`, \`Organization\`, \`sameAs\`.
4. **Generación de JSON-LD Recomendado**: Si faltan esquemas clave, generar el bloque JSON-LD listo para incrustar.
`.trim(),
  },

  // ── 4. SEO COMPETITOR (SERP Gap & Competitive Benchmark) ───────────────
  {
    id: 'seo.competitor',
    version: '1.0.0',
    name: 'Benchmark de Competencia y SERP Gap',
    description: 'Compara la visibilidad orgánica, posicionamiento en SERP y cobertura de términos clave contra competidores directos.',
    category: 'RESEARCH',
    requiredCapabilities: ['web.search', 'web.extract'],
    requiredTools: ['web.search', 'web.extract'],
    executionClass: 'ANALYZE',
    riskClass: 'MEDIUM',
    produces: 'ARTIFACT',
    tenantScoped: true,
    governance: { approvalRequired: false },
    inputsSchema: {
      type: 'object',
      properties: {
        tenantUrl: { type: 'string' },
        competitorUrls: { type: 'array', items: { type: 'string' } },
        targetTopics: { type: 'array', items: { type: 'string' } },
      },
      required: ['tenantUrl', 'competitorUrls', 'targetTopics'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        serpRankings: { type: 'object' },
        competitorStrengths: { type: 'array', items: { type: 'string' } },
        captureOpportunities: { type: 'array', items: { type: 'string' } },
        strategicDeltas: { type: 'array' },
      },
    },
    procedure: `
# Procedimiento: Benchmark de Competencia y SERP Gap (seo.competitor)

## Contexto & Objetivos
Identificar qué términos y búsquedas están siendo capturadas por los competidores y qué deficiencias en su cobertura representan oportunidades inmediatas de crecimiento orgánico para el tenant.

## Pasos Operativos
1. **Muestreo en SERP**: Utilizar \`web.search\` para consultar los tópicos clave en motores independientes (Brave / SearXNG).
2. **Extracción Comparativa**: Extraer resúmenes de las páginas competidoras mejor posicionadas mediante \`web.extract\`.
3. **Matriz Comparativa**:
   - Títulos y propuestas de valor visibles.
   - Profundidad de contenido y presencia de datos técnicos.
   - Enlaces y referencias externas.
4. **Síntesis Estratégica**: Formular recomendaciones operativas de Growth OS: "Tu competidor está capturando 'departamentos en Tulum tokenizados' con un artículo de 600 palabras sin datos estructurados; una guía con Schema.org capturaría esta cuota".
`.trim(),
  },

  // ── 5. SEO GEO (Generative Engine Optimization & Citability) ───────────
  {
    id: 'seo.geo',
    version: '1.0.0',
    name: 'Optimización para Motores Generativos (GEO)',
    description: 'Evalúa la preparación para citabilidad en modelos de IA (ChatGPT, Perplexity, Gemini, Claude), directivas robots y machine-readable specs.',
    category: 'SEO',
    requiredCapabilities: ['web.extract'],
    requiredTools: ['web.fetch', 'web.extract'],
    executionClass: 'ANALYZE',
    riskClass: 'LOW',
    produces: 'EVIDENCE',
    tenantScoped: true,
    governance: { approvalRequired: false },
    inputsSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string' },
      },
      required: ['targetUrl'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        citabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        aiBotAccess: { type: 'object' },
        llmsTxtStatus: { type: 'string', enum: ['PRESENT_VALID', 'PRESENT_INVALID', 'ABSENT'] },
        atomicFactsIdentified: { type: 'number' },
        entityConsistency: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
    procedure: `
# Procedimiento: Optimización para Motores Generativos (seo.geo)

## Principio Cardinal de Realismo Técnico
\`llms.txt\` NO es una palanca mágica ni garantiza indexación universal en modelos cerrados. Es una especificación informativa machine-readable. El verdadero GEO depende de:
1. Citabilidad basada en datos atómicos y hechos verificables.
2. Accesibilidad de rastreadores de IA en robots.txt (\`GPTBot\`, \`PerplexityBot\`, \`ClaudeBot\`, \`Google-Extended\`).
3. Datos estructurados limpios (Schema.org JSON-LD).
4. Consistencia de la entidad ontológica en todo el dominio.

## Pasos Operativos
1. **Auditoría de Robots.txt**:
   - Consultar \`/robots.txt\` usando \`web.fetch\`.
   - Verificar si los User-Agents de IA están bloqueados con \`Disallow: /\`.
2. **Inspección de llms.txt**:
   - Consultar \`/llms.txt\` y \`/llms-full.txt\`.
   - Validar formato Markdown limpio, enlaces absolutos y ausencia de marketing fluff.
3. **Evaluación de Citabilidad**:
   - Analizar si las aseveraciones clave (retornos, ubicación, tokenomics, legalidad) están redactadas como hechos directos con atribución o como texto ambiguo.
4. **Consistencia de Entidad**:
   - Contrastar el nombre del proyecto, fundador y propuesta de valor con el Knowledge Vault soberano.
5. **Emisión de Citability Score**: Calcular el índice compuesto de descubribilidad por agentes de IA.
`.trim(),
  },

  // ── 6. WEB SEARCH (Multi-Provider Web Discovery) ───────────────────────
  {
    id: 'web.search',
    version: '1.0.0',
    name: 'Búsqueda Web Soberana',
    description: 'Ejecuta consultas de búsqueda web a través de proveedores independientes (Brave Search / SearXNG) bajo control de cuotas.',
    category: 'WEB_INTELLIGENCE',
    requiredCapabilities: ['web.search'],
    requiredTools: ['web.search'],
    executionClass: 'READ',
    riskClass: 'LOW',
    produces: 'DATA',
    tenantScoped: true,
    governance: { approvalRequired: false },
    inputsSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        maxResults: { type: 'number', default: 5 },
      },
      required: ['query'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              snippet: { type: 'string' },
            },
          },
        },
      },
    },
    procedure: `
# Procedimiento: Búsqueda Web Soberana (web.search)

## Contexto & Objetivos
Permitir a Hermes consultar información pública del mundo exterior sin intermediarios que comprometan la soberanía de la consulta.

## Reglas de Ejecución
1. La consulta debe ser sanitizada (sin caracteres de inyección de prompt).
2. Se despacha al Tool Gateway quien enruta al proveedor configurado (Brave Search API o SearXNG).
3. Las URLs resultantes se devuelven como datos estructurados listos para ser consumidos o filtrados.
`.trim(),
  },

  // ── 7. WEB EXTRACT (Clean Structured Content Extraction) ───────────────
  {
    id: 'web.extract',
    version: '1.0.0',
    name: 'Extracción de Contenido Web Limpio',
    description: 'Descarga y extrae el texto principal, encabezados y metadatos de una URL eliminando ruido y publicidad.',
    category: 'WEB_INTELLIGENCE',
    requiredCapabilities: ['web.extract'],
    requiredTools: ['web.fetch', 'web.extract'],
    executionClass: 'READ',
    riskClass: 'LOW',
    produces: 'DATA',
    tenantScoped: true,
    governance: { approvalRequired: false },
    inputsSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        mode: { type: 'string', enum: ['markdown', 'text', 'html'], default: 'markdown' },
      },
      required: ['url'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        content: { type: 'string' },
        title: { type: 'string' },
        metadata: { type: 'object' },
      },
    },
    procedure: `
# Procedimiento: Extracción de Contenido Web Limpio (web.extract)

## Invariante Anti-SSRF
Toda URL debe ser validada mediante \`EgressGuard\` antes de cualquier intento de conexión.

## Pasos Operativos
1. Invocar \`SafeHttpClient.fetch(url)\` con timeout de 6000ms y límite de 5MB.
2. Limpiar el DOM: remover scripts, styles, iframes, anuncios y navegación irrelevante.
3. Transformar a Markdown estructurado con preservación de tablas y jerarquías.
`.trim(),
  },

  // ── 8. WEB CRAWL (Governed Recursive Site Exploration) ─────────────────
  {
    id: 'web.crawl',
    version: '1.0.0',
    name: 'Rastreo Web Acotado y Gobernado',
    description: 'Explora recursivamente páginas bajo un mismo subdominio respetando límites de profundidad, tasa y robots.txt.',
    category: 'WEB_INTELLIGENCE',
    requiredCapabilities: ['web.crawl'],
    requiredTools: ['web.crawl', 'web.extract'],
    executionClass: 'ANALYZE',
    riskClass: 'MEDIUM',
    produces: 'ARTIFACT',
    tenantScoped: true,
    governance: { approvalRequired: false },
    inputsSchema: {
      type: 'object',
      properties: {
        baseUrl: { type: 'string' },
        maxPages: { type: 'number', default: 10, maximum: 50 },
        maxDepth: { type: 'number', default: 2, maximum: 3 },
      },
      required: ['baseUrl'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        pagesDiscovered: { type: 'number' },
        pagesExtracted: { type: 'array' },
        sitemapGraph: { type: 'object' },
      },
    },
    procedure: `
# Procedimiento: Rastreo Web Acotado y Gobernado (web.crawl)

## Reglas de Contención
- Límite absoluto de páginas por corrida: 50 páginas máximo.
- Restricción de dominio: El rastreador NUNCA cruza fuera del host de origen especificado en \`baseUrl\`.
- Respeto estricto a las directivas \`Crawl-Delay\` y \`Disallow\` de \`robots.txt\`.
`.trim(),
  },

  // ── 9. WEB BROWSER (Isolated Dynamic Page Automation) ──────────────────
  {
    id: 'web.browser',
    version: '1.0.0',
    name: 'Navegación Dinámica y Headless Browser',
    description: 'Ejecuta renderizado completo de JavaScript, interacciones de formulario y captura de vistas para SPAs complejas.',
    category: 'WEB_INTELLIGENCE',
    requiredCapabilities: ['web.browser'],
    requiredTools: ['web.browser'],
    executionClass: 'EXECUTE',
    riskClass: 'HIGH',
    produces: 'ARTIFACT',
    tenantScoped: true,
    governance: { approvalRequired: true, requiredClearance: 'TIER_2_OPERATOR' },
    inputsSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string' },
        actions: { type: 'array', items: { type: 'string' } },
        waitForSelector: { type: 'string' },
      },
      required: ['targetUrl'],
    },
    outputsSchema: {
      type: 'object',
      properties: {
        pageContent: { type: 'string' },
        screenshotRef: { type: 'string' },
        executionLog: { type: 'array' },
      },
    },
    procedure: `
# Procedimiento: Navegación Dinámica y Headless Browser (web.browser)

## Gobernanza Crítica
- Requiere aprobación (\`approvalRequired: true\`) para cualquier acción interactiva o de envío de formulario.
- Toda sesión de navegador opera en un sandbox efímero aislado por tenant.
- Se prohíbe terminantemente el acceso a subredes LAN, loopback o metadatos de nube mediante la verificación obligatoria de \`EgressGuard\`.
`.trim(),
  },
];

/**
 * Automatically registers canonical skills into the singleton registry.
 */
export function registerCanonicalSkills(registry: HermesSkillRegistry = HermesSkillRegistry.getInstance()): void {
  for (const skill of CANONICAL_SKILLS) {
    registry.register(skill);
  }
}
