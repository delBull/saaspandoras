/**
 * 🛡️ Multi-Tenant Response Policy Gate (Milestone K25.5 Generalization)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/policy/tenant-response-policy.ts
 *
 * Provides a Generalized, Tenant-Scoped Response Policy Engine with:
 * 1. UNIVERSAL BASELINE FIREWALL: Zero-tolerance restrictions enforced across 100% of tenants
 *    (guaranteed returns, guaranteed liquidity, fake regulatory approvals).
 * 2. TENANT-SPECIFIC POLICY PACKS: Pluggable forbidden assertions, terminology normalization,
 *    and echo sanitization loaded dynamically or via canonical registrations.
 * 3. FALLBACK & AUDIT GOVERNANCE: Deterministic BLOCK / REWRITE / ALLOW decisions.
 */

export interface ForbiddenAssertionRule {
  pattern: RegExp | string;
  code: string;
  message: string;
  isBlock?: boolean;
}

export interface ForbiddenEchoRule {
  trigger: RegExp | string;
  replacement: string;
}

export interface TenantResponsePolicyConfig {
  tenantId: string;
  forbiddenAssertions?: ForbiddenAssertionRule[];
  preferredTerminology?: Record<string, string>;
  forbiddenEchoTerms?: ForbiddenEchoRule[];
  claimRules?: {
    noGuaranteedReturns?: boolean;
    noGuaranteedLiquidity?: boolean;
    noUnverifiedLegalClaims?: boolean;
  };
  fallbackResponse?: string;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  action: 'ALLOW' | 'REWRITE' | 'BLOCK';
  sanitizedOutput: string;
  violations: Array<{ code: string; message: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. UNIVERSAL BASELINE RULES (Active for ALL Tenants in Pandora's OS)
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_BASELINE_RULES: ForbiddenAssertionRule[] = [
  {
    pattern: /\b(?:liquidez garantizada|guaranteed liquidity)\b/i,
    code: 'FORBIDDEN_FINANCIAL_PROMISE',
    message: 'Prohibido prometer o garantizar liquidez financiera en cualquier proyecto.',
    isBlock: true,
  },
  {
    pattern: /\b(?:retorno garantizado|rendimiento garantizado|rendimientos? fijos? garantizados?|guaranteed returns?|fixed return)\b/i,
    code: 'FORBIDDEN_FINANCIAL_PROMISE',
    message: 'Prohibido prometer rendimientos fijos o retornos garantizados.',
    isBlock: true,
  },
  {
    pattern: /\b(?:aprobado por la cnbv|sec approved|autorizado por la sec)\b/i,
    code: 'REGULATORY_CLAIM',
    message: 'Prohibido afirmar autorización regulatoria sin respaldo activo.',
    isBlock: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. S'NARAI CANONICAL SEED POLICY
// ─────────────────────────────────────────────────────────────────────────────

export const SNARAI_RESPONSE_POLICY: TenantResponsePolicyConfig = {
  tenantId: 'snarai',
  forbiddenAssertions: [
    {
      pattern: /\b(?:fideicomiso|fideicomiso inmobiliario|nom-?151)\b/i,
      code: 'FORBIDDEN_LEGAL_FRAMEWORK',
      message: "S'Narai opera exclusivamente bajo Aztecas Hub S.A.P.I. de C.V. y contratos de participación digital. Prohibido afirmar fideicomiso o NOM-151.",
      isBlock: true,
    },
    {
      pattern: /\b(?:condo-?hotel|rentas? hoteleras?|noches? de estancia|paquetes? de noches?|noches? anuales?|noches? de hotel)\b/i,
      code: 'FORBIDDEN_HOSPITALITY_MODEL',
      message: "S'Narai es un desarrollo residencial boutique con rentas vacacionales administradas. Prohibido clasificar como hotel o paquetes de noches.",
      isBlock: true,
    },
    {
      pattern: /\b(?:estrategia de familia|add-?on (?:de )?familia(?:r)?|paquete familiar)\b/i,
      code: 'FORBIDDEN_PRODUCT_INVENTION',
      message: "No existe el producto 'Estrategia de Familia' ni add-ons familiares en S'Narai.",
      isBlock: true,
    },
  ],
  preferredTerminology: {
    '\\bCPs\\b': 'Títulos de Participación',
    '\\bCP\\b': 'Título de Participación',
    'Propiedad Fraccionada': 'Inversión Fraccionada',
    'rentas? hoteleras?': 'rentas vacacionales',
  },
  forbiddenEchoTerms: [
    {
      trigger: /No(?: usamos| operamos bajo)? un fideicomiso/gi,
      replacement: "S'Narai opera bajo la estructura corporativa de Aztecas Hub S.A.P.I. de C.V.",
    },
    {
      trigger: /No es un condo-?hotel/gi,
      replacement: "S'Narai es un complejo residencial boutique con rentas vacacionales",
    },
  ],
  fallbackResponse:
    "S'Narai Riviera Nayarit opera bajo el marco corporativo de Aztecas Hub S.A.P.I. de C.V. mediante Títulos de Participación de Inversión Fraccionada. No operamos bajo esquemas hoteleros, fideicomisos ni paquetes de noches. Puedes consultar los detalles y la documentación oficial en el portal: https://snarai.aztecaz.xyz/portal",
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GENERIC MULTI-TENANT POLICY GATE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class TenantResponsePolicyGate {
  private static registeredPolicies: Map<string, TenantResponsePolicyConfig> = new Map([
    ['snarai', SNARAI_RESPONSE_POLICY],
    ['org_snarai', SNARAI_RESPONSE_POLICY],
  ]);

  /**
   * Registers or updates a tenant response policy at runtime
   */
  public static registerPolicy(config: TenantResponsePolicyConfig): void {
    const key = config.tenantId.toLowerCase().replace(/^org_/, '');
    this.registeredPolicies.set(key, config);
    this.registeredPolicies.set(`org_${key}`, config);
  }

  /**
   * Dynamically constructs a TenantResponsePolicyConfig from active knowledge records in context (e.g. banned_topics)
   */
  public static extractPolicyFromActiveKnowledge(
    tenantId: string,
    activeKnowledge?: Array<{ dimension: string; key: string; content: string }>
  ): TenantResponsePolicyConfig | undefined {
    if (!activeKnowledge || activeKnowledge.length === 0) return undefined;

    const policyDocs = activeKnowledge.filter(
      k =>
        k?.dimension === 'policy' ||
        (typeof k?.key === 'string' && (k.key.includes('banned') || k.key.includes('policy')))
    );
    if (policyDocs.length === 0) return undefined;

    const forbiddenAssertions: ForbiddenAssertionRule[] = [];

    for (const doc of policyDocs) {
      const lines = doc.content.split('\n');
      for (const line of lines) {
        const match =
          line.match(/PROHIBIDO(?:\s+\w+)*\s+["“]([^"”]+)["”]/i) ||
          line.match(/PROHIBIDO:?\s+([^*\n]+)/i);
        if (match && match[1]) {
          const rawKeyword = match[1].trim();
          const cleanPattern = rawKeyword
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/,\s*/g, '|');
          if (cleanPattern.length > 2) {
            forbiddenAssertions.push({
              pattern: new RegExp(`\\b(?:${cleanPattern})\\b`, 'i'),
              code: 'FORBIDDEN_CONCEPT_POLICY',
              message: `Violación de política de divulgación activa del tenant: ${rawKeyword}`,
              isBlock: true,
            });
          }
        }
      }
    }

    if (forbiddenAssertions.length === 0) return undefined;

    return {
      tenantId,
      forbiddenAssertions,
    };
  }

  /**
   * Evaluates and sanitizes a proposed LLM output for ANY tenant.
   */
  public static evaluate(
    content: string,
    tenantId?: string,
    customPolicy?: TenantResponsePolicyConfig,
    activeKnowledge?: Array<{ dimension: string; key: string; content: string }>
  ): PolicyEvaluationResult {
    const cleanTenant = (tenantId || 'generic').toLowerCase().replace(/^org_/, '');
    const registered = this.registeredPolicies.get(cleanTenant);
    const fromKnowledge = this.extractPolicyFromActiveKnowledge(cleanTenant, activeKnowledge);

    // Merge registered, dynamic from knowledge, and custom policies
    const policy: TenantResponsePolicyConfig | undefined = customPolicy || {
      tenantId: cleanTenant,
      forbiddenAssertions: [
        ...(registered?.forbiddenAssertions || []),
        ...(fromKnowledge?.forbiddenAssertions || []),
      ],
      preferredTerminology: registered?.preferredTerminology,
      forbiddenEchoTerms: registered?.forbiddenEchoTerms,
      fallbackResponse: registered?.fallbackResponse,
    };

    const violations: Array<{ code: string; message: string }> = [];
    let sanitized = content;

    // 1. Terminology Normalization (Tenant specific)
    if (policy?.preferredTerminology) {
      sanitized = this.applyTerminology(sanitized, policy.preferredTerminology);
    }

    // 2. Check Universal Baseline Rules (Enforced for 100% of tenants)
    for (const rule of UNIVERSAL_BASELINE_RULES) {
      const reg = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'i') : rule.pattern;
      if (reg.test(sanitized)) {
        if (this.isPositiveAssertion(sanitized, reg)) {
          violations.push({ code: rule.code, message: rule.message });
        }
      }
    }

    // 3. Check Tenant-Specific Rules (if configured)
    if (policy?.forbiddenAssertions) {
      for (const rule of policy.forbiddenAssertions) {
        const reg = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'i') : rule.pattern;
        if (reg.test(sanitized)) {
          const isPositive = this.isPositiveAssertion(sanitized, reg);
          
          // Logging para depuración de policy gate (solo en desarrollo)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[PolicyGate] Tenant=${cleanTenant} Rule=${rule.code}`, {
              isPositive,
              matchedText: sanitized.match(reg)?.[0],
              action: isPositive ? 'BLOCK' : (policy.forbiddenEchoTerms ? 'REWRITE' : 'ALLOW'),
            });
          }
          
          if (isPositive) {
            violations.push({ code: rule.code, message: rule.message });
          } else if (policy.forbiddenEchoTerms) {
            sanitized = this.applyEchoSanitizers(sanitized, policy.forbiddenEchoTerms);
          }
        }
      }
    }

    // 4. Determine final decision
    if (violations.length > 0) {
      const fallback =
        policy?.fallbackResponse ||
        `Información no compatible con la política de divulgación institucional del proyecto. Puedes consultar la documentación oficial autorizada en el portal.`;

      return {
        allowed: false,
        action: 'BLOCK',
        sanitizedOutput: fallback,
        violations,
      };
    }

    const wasRewritten = sanitized !== content;

    return {
      allowed: true,
      action: wasRewritten ? 'REWRITE' : 'ALLOW',
      sanitizedOutput: sanitized,
      violations: [],
    };
  }

  /**
   * Applies regex replacement map for terminology normalization
   */
  public static applyTerminology(text: string, termMap: Record<string, string>): string {
    let result = text;
    for (const [patternStr, replacement] of Object.entries(termMap)) {
      const reg = new RegExp(patternStr, 'g');
      result = result.replace(reg, replacement);
    }
    return result.replace(/[ \t]+/g, ' ');
  }

  /**
   * Applies echo sanitizers to remove forbidden words even from negative phrases
   */
  private static applyEchoSanitizers(text: string, sanitizers: ForbiddenEchoRule[]): string {
    let result = text;
    for (const rule of sanitizers) {
      const reg = typeof rule.trigger === 'string' ? new RegExp(rule.trigger, 'gi') : rule.trigger;
      result = result.replace(reg, rule.replacement);
    }
    return result;
  }

  /**
   * Distinguishes positive assertions from explicit denials, disclaimers, or transparent limitation explanations.
   */
  private static isPositiveAssertion(text: string, pattern: RegExp): boolean {
    const match = text.match(pattern);
    if (!match) return false;

    const lower = text.toLowerCase();
    const denialPatterns = [
      // Negaciones directas de estado/operación (primera y tercera persona)
      /no\s+(?:es|opera|ofrece|incluye|utiliza|contempla|existe|cuenta|manejamos|tenemos|disponemos|aplica|está|ha\s+obtenido|debe|posee|requiere|necesita|dispone|tiene|utilizan|manejan)/i,
      // Negaciones de obligación/deber
      /no\s+debe\s+(?:presentarse|considerarse|afirmarse|entenderse|interpretarse|tomarse|verse|asumirse)/i,
      // Negaciones de posesión/disponibilidad (todas las personas)
      /no\s+(?:contamos\s+con|disponemos\s+de|se\s+cuenta\s+con|está\s+certificado|posee|tiene\s+|ha\s+obtenido|ha\s+sido|disponen\s+de|cuentan\s+con)/i,
      // Ausencia o carencia
      /sin\s+(?:garantía|fideicomiso|noches|certificación|rendimiento|respaldo|aval|autorización|licencia|permiso)/i,
      // Estados temporales pendientes
      /todavía\s+no|aún\s+no|en\s+proceso(?:\s+de)?|en\s+trámite|pendiente\s+de|a\s+la\s+espera\s+de/i,
      // Negaciones impersonales
      /no\s+se\s+(?:ha\s+obtenido|garantiza|ofrece|maneja|presenta|cuenta|dispone|certifica|autoriza)/i,
      // Aclaraciones de no-certificación
      /no\s+(?:debe\s+presentarse\s+como|debe\s+interpretarse\s+como|constituye|representa|implica)\s+(?:certificación|garantía|aval|respaldo)/i,
      // Declaraciones transparentes de limitación (nom/certificación en cualquier posición)
      /no\s+(?:disponemos\s+de|contamos\s+con|tenemos\s+|existe\s+|se\s+cuenta\s+con|dispone\s+de|tiene\s+)\s+(?:nom|certificación|registro|autorización|licencia|fideicomiso)/i,
      // Negaciones con "nunca" o "jamás"
      /nunca\s+(?:hemos|se\s+ha|se\s+ofrece|se\s+garantiza)|jamás\s+(?:hemos|se\s+ha)/i,
      // Frases de transparencia regulatoria
      /no\s+debe\s+presentarse\s+como\s+(?:certificación|garantía|aval)\s+(?:existente|obtenida|vigente)|no\s+certificado|no\s+autorizado/i,
      // Patrón genérico: "no" seguido de concepto prohibido en 10 palabras
      /no\s+(?:\w+\s+){0,10}(?:nom|fideicomiso|certificación|garantía|rendimiento|liquidez)/i,
    ];

    // Ampliamos el contexto para capturar negaciones que puedan estar más lejos del match
    const matchIndex = match.index || 0;
    const snippet = lower.substring(Math.max(0, matchIndex - 150), Math.min(lower.length, matchIndex + 200));

    return !denialPatterns.some(dp => dp.test(snippet));
  }
}
