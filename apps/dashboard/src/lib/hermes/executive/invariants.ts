/**
 * 🛡️ Hermes Executive Sovereign Plane — Hard Inviolable Bounds & System Invariants
 * apps/dashboard/src/lib/hermes/executive/invariants.ts
 *
 * Enforces fundamental, unbreachable rules that apply to ALL actors,
 * including Marco (Founder / Maximum Executive Authority).
 *
 * Principle: Marco has Maximum Authority, but Hermes has Hard Inviolable Bounds.
 * No command — regardless of origin, clearance, or phrasing — can breach an invariant.
 */

import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';

export type SystemHardInvariant =
  | 'CANNOT_CHANGE_ROOT_SIGNER'
  | 'CANNOT_TRANSFER_FOUNDER_IDENTITY'
  | 'CANNOT_GRANT_UNAUTHORIZED_FOUNDER_ROOT'
  | 'CANNOT_MUTATE_EXECUTIVE_POLICY_RULES'
  | 'CANNOT_EXECUTE_FINANCIAL_ACTION_WITHOUT_SIGNATURE'
  | 'CANNOT_REPLAY_FINANCIAL_SIGNATURE'
  | 'CANNOT_MUTATE_PRODUCTION_FILESYSTEM_DIRECTLY';

export interface InvariantCheckResult {
  allowed: boolean;
  violatedInvariant?: SystemHardInvariant;
  reason?: string;
}

export class SystemInvariantEnforcer {
  /**
   * Protected file patterns that Hermes must NEVER propose or apply code patches to.
   * Modifying these would allow self-escalation or bypassing security controls.
   */
  public static readonly PROTECTED_AUTHORITY_PATTERNS = [
    'src/lib/hermes/executive/invariants.ts',
    'src/lib/hermes/executive/types.ts',
    'src/lib/hermes/executive/code-operator.ts',
    'src/lib/hermes/executive/financial-orchestrator.ts',
    'src/lib/pandoras/core/domains/hermes/runtime/security-audit-logger.ts',
    'src/lib/hermes/identity/interlocutor-resolver.ts',
  ];

  /**
   * Validates if a proposed action or command breaches any system invariant.
   */
  public static checkCommandInvariants(params: {
    commandText: string;
    actorId: string;
    organizationId?: string;
  }): InvariantCheckResult {
    const text = (params.commandText || '').toLowerCase();

    // 1. Invariant: Root signer modification
    if (
      /(cambi|modific|reemplaz|replac|updat|switch|alter)/i.test(text) &&
      /(root\s*signer|firmante\s*ra[ií]z)/i.test(text)
    ) {
      return {
        allowed: false,
        violatedInvariant: 'CANNOT_CHANGE_ROOT_SIGNER',
        reason: 'Hard Inviolable Bound: El root signer del protocolo es inmutable por software y no puede modificarse mediante comandos ejecutivos.',
      };
    }

    // 2. Invariant: Founder identity transfer
    if (
      /(transfer|transfier|cambi|reemplaz|ceder|asign)/i.test(text) &&
      /(founder|fundador)/i.test(text)
    ) {
      return {
        allowed: false,
        violatedInvariant: 'CANNOT_TRANSFER_FOUNDER_IDENTITY',
        reason: 'Hard Inviolable Bound: La identidad canónica del Fundador es una constante soberana inalterable.',
      };
    }

    // 3. Invariant: Unauthorized founder root granting
    if (
      /(otorg|dar|conced|grant|hacer).*founder(_root)?/i.test(text) &&
      !text.includes('briefing') && !text.includes('status')
    ) {
      return {
        allowed: false,
        violatedInvariant: 'CANNOT_GRANT_UNAUTHORIZED_FOUNDER_ROOT',
        reason: 'Hard Inviolable Bound: Los privilegios de Root Fundador no son delegables ni transferibles a terceros.',
      };
    }

    // 4. Invariant: Self-mutation of executive policies
    if (
      /(desactiv|disable|eliminar|bypass|apag).*guardrail/i.test(text) ||
      (/(modific|cambi|alter|bypass).*(executive\s*policy|pol[ií]tica\s*ejecutiva)/i.test(text))
    ) {
      return {
        allowed: false,
        violatedInvariant: 'CANNOT_MUTATE_EXECUTIVE_POLICY_RULES',
        reason: 'Hard Inviolable Bound: Hermes tiene estrictamente prohibido alterar o desactivar sus propias reglas de política ejecutiva y auditoría.',
      };
    }

    return { allowed: true };
  }

  /**
   * Validates if a proposed code patch touches protected security/authority files.
   */
  public static checkCodeFilesInvariant(files: string[]): InvariantCheckResult {
    for (const file of files) {
      const normalized = file.replace(/\\/g, '/');
      for (const pattern of this.PROTECTED_AUTHORITY_PATTERNS) {
        if (normalized.includes(pattern)) {
          return {
            allowed: false,
            violatedInvariant: 'CANNOT_MUTATE_EXECUTIVE_POLICY_RULES',
            reason: `Hard Inviolable Bound: El archivo \`${file}\` forma parte del núcleo de autoridad ejecutiva y auditoría. No puede ser alterado mediante propuestas de parche de Hermes.`,
          };
        }
      }
    }
    return { allowed: true };
  }

  /**
   * Logs an invariant breach attempt to the immutable security log.
   */
  public static async logInvariantBreach(params: {
    actorId: string;
    organizationId: string;
    violatedInvariant: SystemHardInvariant;
    reason: string;
    correlationId?: string;
    rawPayload?: any;
  }): Promise<void> {
    await SecurityAuditLogger.logEvent({
      organizationId: params.organizationId || 'pandoras_root',
      actorId: params.actorId,
      eventType: 'SYSTEM_INVARIANT_VIOLATION',
      severity: 'CRITICAL',
      policyDecision: 'DENY',
      correlationId: params.correlationId || `inv_${Date.now()}`,
      toolId: 'SystemInvariantEnforcer',
      metadata: {
        violatedInvariant: params.violatedInvariant,
        reason: params.reason,
        rawPayload: params.rawPayload,
      },
    });
  }
}
