/**
 * 🎯 Hermes Executive Sovereign Plane — Operational Intent Classifier
 * apps/dashboard/src/lib/hermes/executive/intent-classifier.ts
 *
 * Classifies founder messages into:
 * - Capabilities guide / help (e.g. "¿Qué puedes hacer por mí?")
 * - Two-phase confirmation (e.g. "confirmo", "ejecuta", "procede")
 * - Cancellation (e.g. "cancela", "aborta")
 * - Canonical operational actions (Credit top-up, Collaborator RBAC, Tenant status)
 * - Financial pre-flight & signatures (USDC Distribution / EIP-712 settlement)
 * - Code diagnosis & sandboxed patch approval
 */

import { ParsedExecutiveIntent } from './types';
import { ExecutiveCapabilitiesManifest } from './capabilities-manifest';

export class ExecutiveIntentClassifier {
  /**
   * Parse founder utterance into an executive intent.
   */
  public static classify(message: string): ParsedExecutiveIntent {
    const text = (message || '').trim();
    if (!text) return { type: 'NONE' };

    // 1. Capabilities inquiry ("¿Qué puedes hacer por mí?", etc.)
    if (ExecutiveCapabilitiesManifest.isCapabilitiesQuery(text)) {
      return { type: 'CAPABILITIES_HELP', raw: text };
    }

    // 2. Two-phase confirmation
    if (this.isConfirmation(text)) {
      return { type: 'CONFIRMATION', raw: text };
    }

    // 3. Cancellation
    if (this.isCancellation(text)) {
      return { type: 'CANCELLATION', raw: text };
    }

    // 4. Financial Signature Submission ("firma fin_... 0x...")
    const sigIntent = this.parseFinancialSignatureIntent(text);
    if (sigIntent) return sigIntent;

    // 5. Financial Pre-flight Proposal ("prepara distribución de 5000 usdc...")
    const finIntent = this.parseFinancialProposalIntent(text);
    if (finIntent) return finIntent;

    // 6. Code Patch Approval ("apruebo parche patch_...")
    const codeApproveIntent = this.parseCodeApprovalIntent(text);
    if (codeApproveIntent) return codeApproveIntent;

    // 7. Code Diagnosis ("diagnostica este error: ...")
    const diagIntent = this.parseCodeDiagnosisIntent(text);
    if (diagIntent) return diagIntent;

    // 8. Operational Action: Top-up Compute Credits
    const topupIntent = this.parseTopupIntent(text);
    if (topupIntent) return topupIntent;

    // 9. Operational Action: Set Collaborator Role
    const roleIntent = this.parseRoleIntent(text);
    if (roleIntent) return roleIntent;

    // 10. Operational Action: Invite Collaborator
    const inviteIntent = this.parseInviteIntent(text);
    if (inviteIntent) return inviteIntent;

    // 11. Operational Action: Set Tenant Status
    const statusIntent = this.parseTenantStatusIntent(text);
    if (statusIntent) return statusIntent;

    return { type: 'NONE' };
  }

  public static isConfirmation(text: string): boolean {
    return /^(?:confirmo|confirmar|confirma|ejecuta|ejecutar|procede|proceder|adelante|sí|si|dale|ok|hazlo|\/confirm|\/ejecutar)$/i.test(text.trim());
  }

  public static isCancellation(text: string): boolean {
    return /^(?:cancela|cancelar|aborta|abortar|no|det[eé]n|detener|descarta|descartar|\/cancel|\/abortar)$/i.test(text.trim());
  }

  private static parseFinancialSignatureIntent(text: string): ParsedExecutiveIntent | null {
    // Pattern: "firma fin_123 0x..." / "/sign fin_123 0x..."
    const match = text.match(/(?:firma|asienta|sign|\/sign)\s+(fin_[a-zA-Z0-9_]+)\s+(0x[a-fA-F0-9]{130})/i);
    if (match && match[1] && match[2]) {
      return {
        type: 'FINANCIAL_SIGNATURE',
        proposalId: match[1],
        signature: match[2],
      };
    }
    return null;
  }

  private static parseFinancialProposalIntent(text: string): ParsedExecutiveIntent | null {
    // Slash: /distribute snarai 5000 0x00c9f7ee9252cbe5eb7b370605a9b7c44756f40b Dividendos Q3
    const slashMatch = text.match(/^\/(?:distribute|transfer)\s+([a-zA-Z0-9_-]+)\s+(\d+(?:\.\d+)?)\s+(0x[a-fA-F0-9]{40})(?:\s+(.+))?/i);
    if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[3]) {
      return {
        type: 'FINANCIAL_PROPOSAL',
        action: 'USDC_DISTRIBUTION',
        tenantId: slashMatch[1].toLowerCase(),
        amountUsd: parseFloat(slashMatch[2]),
        recipient: slashMatch[3].toLowerCase(),
        purpose: slashMatch[4]?.trim() || 'Distribución pro-rata autorizada por el Fundador',
      };
    }

    // Natural: "prepara distribución de 5000 usdc para snarai a 0x00c9f7ee... por concepto de dividendos"
    const naturalMatch = text.match(
      /(?:prepara\s+distribuci[oó]n|distribuye|transfiere|transferir)\s+(?:de\s+)?\$?(\d+(?:\.\d+)?)\s*(?:usdc|usd|d[oó]lares)?\s+(?:para|de|del tenant)\s+([a-zA-Z0-9_-]+)\s+(?:a|al beneficiario|hacia)\s+(0x[a-fA-F0-9]{40})(?:\s+(?:por|concepto|motivo|para)\s+(.+))?/i
    );
    if (naturalMatch && naturalMatch[1] && naturalMatch[2] && naturalMatch[3]) {
      return {
        type: 'FINANCIAL_PROPOSAL',
        action: 'USDC_DISTRIBUTION',
        tenantId: naturalMatch[2].toLowerCase(),
        amountUsd: parseFloat(naturalMatch[1]),
        recipient: naturalMatch[3].toLowerCase(),
        purpose: naturalMatch[4]?.trim() || 'Distribución pro-rata autorizada por el Fundador',
      };
    }

    return null;
  }

  private static parseCodeApprovalIntent(text: string): ParsedExecutiveIntent | null {
    const match = text.match(/(?:apruebo\s+parche|autorizo\s+parche|aprobar\s+parche|\/approve-patch)\s+(patch_[a-zA-Z0-9_]+)/i);
    if (match && match[1]) {
      return {
        type: 'CODE_APPROVAL',
        proposalId: match[1],
      };
    }
    return null;
  }

  private static parseCodeDiagnosisIntent(text: string): ParsedExecutiveIntent | null {
    const match = text.match(/(?:diagnostica|analiza|revisa)\s+(?:este\s+)?(?:error|stack trace|fallo|bug)[:\s]+([\s\S]+)/i);
    if (match && match[1]) {
      return {
        type: 'CODE_DIAGNOSIS',
        rawError: match[1].trim(),
      };
    }
    return null;
  }

  private static parseTopupIntent(text: string): ParsedExecutiveIntent | null {
    // Pattern A: "/topup snarai 100"
    const slashMatch = text.match(/^\/topup\s+([a-zA-Z0-9_-]+)\s+(\d+(?:\.\d+)?)/i);
    if (slashMatch && slashMatch[1] && slashMatch[2]) {
      const target = slashMatch[1].toLowerCase();
      const amount = parseFloat(slashMatch[2]);
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'TOPUP_CREDITS',
        target,
        payload: { amountUsd: amount, tenantId: target },
        title: `Asignación de Fondos ($${amount.toFixed(2)} USD)`,
        description: `Recargar $${amount.toFixed(2)} USD de saldo de cómputo en el ledger del tenant '${target}'.`,
        blastRadius: 'MEDIUM',
      };
    }

    // Pattern B: "recarga 100 créditos a snarai" / "asigna 50 usd a snarai"
    const naturalMatchA = text.match(
      /(?:recarga|asigna|agrega|aumenta|cargar|topup|top-up|fondear)\s+(?:(?:saldo|cr[eé]ditos?|c[oó]mputo|fondos)\s+)?(?:de\s+)?\$?(\d+(?:\.\d+)?)\s*(?:usd|d[oó]lares|cr[eé]ditos)?\s+(?:a|al tenant|para el tenant|para)\s+([a-zA-Z0-9_-]+)/i
    );
    if (naturalMatchA && naturalMatchA[1] && naturalMatchA[2]) {
      const amount = parseFloat(naturalMatchA[1]);
      const target = naturalMatchA[2].toLowerCase();
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'TOPUP_CREDITS',
        target,
        payload: { amountUsd: amount, tenantId: target },
        title: `Asignación de Fondos ($${amount.toFixed(2)} USD)`,
        description: `Recargar $${amount.toFixed(2)} USD de saldo de cómputo en el ledger del tenant '${target}'.`,
        blastRadius: 'MEDIUM',
      };
    }

    // Pattern C: "recarga al tenant snarai 100 créditos/usd"
    const naturalMatchB = text.match(
      /(?:recarga|asigna|agrega|aumenta|cargar|topup|top-up|fondear)\s+(?:a|al tenant|para el tenant|para)\s+([a-zA-Z0-9_-]+)\s+(?:(?:saldo|cr[eé]ditos?|c[oó]mputo|fondos)\s+)?(?:de\s+)?\$?(\d+(?:\.\d+)?)/i
    );
    if (naturalMatchB && naturalMatchB[1] && naturalMatchB[2]) {
      const target = naturalMatchB[1].toLowerCase();
      const amount = parseFloat(naturalMatchB[2]);
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'TOPUP_CREDITS',
        target,
        payload: { amountUsd: amount, tenantId: target },
        title: `Asignación de Fondos ($${amount.toFixed(2)} USD)`,
        description: `Recargar $${amount.toFixed(2)} USD de saldo de cómputo en el ledger del tenant '${target}'.`,
        blastRadius: 'MEDIUM',
      };
    }

    return null;
  }

  private static parseRoleIntent(text: string): ParsedExecutiveIntent | null {
    const slashMatch = text.match(/^\/role\s+([^\s]+@[^\s]+)\s+([a-zA-Z0-9_]+)/i);
    if (slashMatch && slashMatch[1] && slashMatch[2]) {
      const email = slashMatch[1].toLowerCase();
      const role = slashMatch[2].toUpperCase();
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'SET_COLLABORATOR_ROLE',
        target: email,
        payload: { email, role },
        title: `Modificación de Rol RBAC (${role})`,
        description: `Actualizar rol de '${email}' a '${role}' en Nexus Collaborators.`,
        blastRadius: 'MEDIUM',
      };
    }

    const naturalMatch = text.match(
      /(?:promueve|cambia el rol de|asigna rol|haz admin a|actualiza rol de)\s+(?:a\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:a|como)\s+([a-zA-Z0-9_]+)/i
    );
    if (naturalMatch && naturalMatch[1] && naturalMatch[2]) {
      const email = naturalMatch[1].toLowerCase();
      const role = naturalMatch[2].toUpperCase();
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'SET_COLLABORATOR_ROLE',
        target: email,
        payload: { email, role },
        title: `Modificación de Rol RBAC (${role})`,
        description: `Actualizar rol de '${email}' a '${role}' en Nexus Collaborators.`,
        blastRadius: 'MEDIUM',
      };
    }

    return null;
  }

  private static parseInviteIntent(text: string): ParsedExecutiveIntent | null {
    const slashMatch = text.match(/^\/invite\s+([^\s]+@[^\s]+)(?:\s+([a-zA-Z0-9_]+))?(?:\s+(.+))?/i);
    if (slashMatch && slashMatch[1]) {
      const email = slashMatch[1].toLowerCase();
      const role = (slashMatch[2] || 'COLLABORATOR').toUpperCase();
      const name = slashMatch[3]?.trim() || email.split('@')[0];
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'INVITE_COLLABORATOR',
        target: email,
        payload: { email, role, name },
        title: `Invitación de Colaborador (${role})`,
        description: `Crear e invitar a '${name}' (${email}) con rol '${role}' a Nexus Collaborators.`,
        blastRadius: 'MEDIUM',
      };
    }

    const naturalMatch = text.match(
      /(?:invita|agrega|crea colaborador|invitar)\s+(?:a\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\s+(?:como|con rol)\s+([a-zA-Z0-9_]+))?(?:\s+(?:llamado|nombre)\s+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]+))?/i
    );
    if (naturalMatch && naturalMatch[1]) {
      const email = naturalMatch[1].toLowerCase();
      const role = (naturalMatch[2] || 'COLLABORATOR').toUpperCase();
      const name = naturalMatch[3]?.trim() || email.split('@')[0];
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'INVITE_COLLABORATOR',
        target: email,
        payload: { email, role, name },
        title: `Invitación de Colaborador (${role})`,
        description: `Crear e invitar a '${name}' (${email}) con rol '${role}' a Nexus Collaborators.`,
        blastRadius: 'MEDIUM',
      };
    }

    return null;
  }

  private static parseTenantStatusIntent(text: string): ParsedExecutiveIntent | null {
    const slashMatch = text.match(/^\/tenant-status\s+([a-zA-Z0-9_-]+)\s+(active|paused|suspended)/i);
    if (slashMatch && slashMatch[1] && slashMatch[2]) {
      const target = slashMatch[1].toLowerCase();
      const status = slashMatch[2].toLowerCase();
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'SET_TENANT_STATUS',
        target,
        payload: { tenantId: target, status },
        title: `Cambio de Estado de Tenant (${status.toUpperCase()})`,
        description: `Actualizar estado del tenant '${target}' a '${status}'.`,
        blastRadius: 'HIGH',
      };
    }

    const naturalMatch = text.match(
      /(?:(pausa|suspende|desactiva|activa))\s+(?:el\s+tenant|el\s+proyecto|tenant|proyecto)\s+([a-zA-Z0-9_-]+)/i
    );
    if (naturalMatch && naturalMatch[1] && naturalMatch[2]) {
      const verb = naturalMatch[1].toLowerCase();
      const target = naturalMatch[2].toLowerCase();
      const status = (verb === 'activa') ? 'active' : 'paused';
      return {
        type: 'OPERATIONAL_ACTION',
        action: 'SET_TENANT_STATUS',
        target,
        payload: { tenantId: target, status },
        title: `Cambio de Estado de Tenant (${status.toUpperCase()})`,
        description: `Actualizar estado del tenant '${target}' a '${status}'.`,
        blastRadius: 'HIGH',
      };
    }

    return null;
  }
}
