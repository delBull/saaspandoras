/**
 * 🏛️ Founder Directives Store (Executive Memory)
 * apps/dashboard/src/lib/hermes/executive/founder-directives.ts
 *
 * Persists and retrieves high-authority directives issued by the Founder (Marco).
 * Decoupled from generic session memory or public institutional knowledge.
 * Injected with top-priority into Hermes Core Reasoning Context in Executive Mode.
 */

import { ExecutiveDirective, DirectiveCategory } from './types';

// In-memory cache backed with resilient fallback
const directivesCache: Map<string, ExecutiveDirective> = new Map();

// Seed canonical founding directives
const SEED_DIRECTIVES: ExecutiveDirective[] = [
  {
    id: 'dir_seed_k25_vault',
    text: 'Toda documentación legal, acuerdos de inversión y Deal Rooms deben quedar anclados en IPFS con bóveda Sovereign K25.',
    category: 'INFRASTRUCTURE_PREFERENCE',
    status: 'ACTIVE',
    createdBy: 'marco_founder',
    channel: 'nexus',
    createdAt: '2026-09-01T00:00:00.000Z',
    authoritative: true,
  },
  {
    id: 'dir_seed_fail_closed',
    text: 'Toda verificación de webhook y autorización externa debe ser fail-closed: rechazo explícito y visible ante cualquier anomalía.',
    category: 'PRODUCT_POLICY',
    status: 'ACTIVE',
    createdBy: 'marco_founder',
    channel: 'nexus',
    createdAt: '2026-09-01T00:00:00.000Z',
    authoritative: true,
  },
  {
    id: 'dir_seed_omnichannel_identity',
    text: 'Identificar a los interlocutores por su nombre registrado en WhatsApp, Telegram y Web, manteniendo trato personalizado y profesional.',
    category: 'GENERAL_STRATEGY',
    status: 'ACTIVE',
    createdBy: 'marco_founder',
    channel: 'nexus',
    createdAt: '2026-09-01T00:00:00.000Z',
    authoritative: true,
  },
];

for (const dir of SEED_DIRECTIVES) {
  directivesCache.set(dir.id, dir);
}

export class FounderDirectiveStore {
  /**
   * Infer directive category from conversational text if not explicitly provided
   */
  public static inferCategory(text: string): DirectiveCategory {
    const lower = text.toLowerCase();
    if (lower.includes('no usar') || lower.includes('prohibido') || lower.includes('vetado') || lower.includes('reemplazar proveedor')) {
      return 'VENDOR_RESTRICTION';
    }
    if (lower.includes('servidor') || lower.includes('neon') || lower.includes('ipfs') || lower.includes('infra') || lower.includes('db')) {
      return 'INFRASTRUCTURE_PREFERENCE';
    }
    if (lower.includes('tenant') || lower.includes('snarai') || lower.includes('aztecas') || lower.includes('cliente')) {
      return 'TENANT_OVERRIDE';
    }
    if (lower.includes('precio') || lower.includes('token') || lower.includes('comisión') || lower.includes('producto') || lower.includes('feature')) {
      return 'PRODUCT_POLICY';
    }
    return 'GENERAL_STRATEGY';
  }

  /**
   * Store a new directive issued by Marco
   */
  public static addDirective(params: {
    text: string;
    category?: DirectiveCategory;
    channel?: 'telegram' | 'whatsapp' | 'nexus' | 'web';
    actorId?: string;
    metadata?: Record<string, any>;
  }): ExecutiveDirective {
    const cleanText = params.text.trim();
    const id = `dir_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const category = params.category || this.inferCategory(cleanText);

    const directive: ExecutiveDirective = {
      id,
      text: cleanText,
      category,
      status: 'ACTIVE',
      createdBy: params.actorId || 'marco_founder',
      channel: params.channel || 'nexus',
      createdAt: new Date().toISOString(),
      authoritative: true,
      metadata: params.metadata,
    };

    directivesCache.set(id, directive);
    console.log(`[FounderDirectiveStore] 📝 Nueva directiva registrada [${category}]: "${cleanText}"`);
    return directive;
  }

  /**
   * Get all active directives
   */
  public static getActiveDirectives(): ExecutiveDirective[] {
    return Array.from(directivesCache.values()).filter((d) => d.status === 'ACTIVE');
  }

  /**
   * Deactivate/archive a directive
   */
  public static deactivateDirective(id: string): boolean {
    const dir = directivesCache.get(id);
    if (!dir) return false;
    dir.status = 'ARCHIVED';
    directivesCache.set(id, dir);
    return true;
  }

  /**
   * Format all active directives into a clean markdown block for HermesPromptBuilder
   */
  public static formatDirectivesForPrompt(): string {
    const active = this.getActiveDirectives();
    if (active.length === 0) return '';

    const lines: string[] = [
      '### 📜 DIRECTIVAS ESTRATÉGICAS DEL FUNDADOR (MARCO) — MÁXIMA AUTORIDAD',
      'Las siguientes directivas han sido emitidas directamente por Marco y tienen precedencia soberana en el razonamiento de Hermes:',
    ];

    for (const d of active) {
      lines.push(`- **[${d.category}]**: ${d.text}`);
    }

    lines.push('Hermes DEBE alinear todas sus propuestas, respuestas operativas y análisis técnicos a estas directivas.');
    return lines.join('\n');
  }
}
