/**
 * 🏛️ PLATFORM AUDIT LEDGER SERVICE (F9.10)
 * apps/dashboard/src/lib/admin/platform-audit-ledger.service.ts
 *
 * Implements tamper-evident hash-chained operational audit logging,
 * structured 9-point trace verification, and historical integrity auditing.
 */

import { createHash } from 'crypto';
import { 
  PlatformAuditEntryDTO, 
  PlatformAuditEventAction, 
  PlatformAuditResult,
  PlatformAuditGovernanceContext,
  PlatformAuditStateTransition
} from '@/lib/dash-contracts/admin';

export interface CreateAuditEntryParams {
  actorId: string;
  actorWallet: string;
  actorRole: string;
  actorType: string;
  action: PlatformAuditEventAction;
  targetResource: string;
  resourceId?: string | null;
  capability: string;
  governance: PlatformAuditGovernanceContext;
  stateTransition: PlatformAuditStateTransition;
  result: PlatformAuditResult;
  evidenceCid?: string | null;
  txHash?: string | null;
}

export class PlatformAuditLedgerService {
  private static sequenceCounter = 0;
  private static lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
  private static readonly memoryChain: PlatformAuditEntryDTO[] = [];

  /**
   * Genera el hash criptográfico SHA-256 inmutable para una entrada dada su anterior hash.
   */
  public static computeEntryHash(prevHash: string, dataToHash: Record<string, any>): string {
    const serialized = JSON.stringify(dataToHash, Object.keys(dataToHash).sort());
    return createHash('sha256')
      .update(prevHash + ':' + serialized)
      .digest('hex');
  }

  /**
   * Registra una acción sensible en el ledger criptográfico con encadenamiento de hash.
   */
  public static recordEntry(params: CreateAuditEntryParams): PlatformAuditEntryDTO {
    this.sequenceCounter++;
    const prevHash = this.lastHash;
    const timestamp = new Date().toISOString();
    const id = `audit_${Date.now()}_seq${this.sequenceCounter}`;

    const dataToHash = {
      sequenceNumber: this.sequenceCounter,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetResource: params.targetResource,
      resourceId: params.resourceId || null,
      capability: params.capability,
      stateTransition: params.stateTransition,
      timestamp,
      result: params.result,
    };

    const currentHash = this.computeEntryHash(prevHash, dataToHash);
    this.lastHash = currentHash;

    const entry: PlatformAuditEntryDTO = {
      id,
      sequenceNumber: this.sequenceCounter,
      prevHash,
      currentHash,
      actorId: params.actorId,
      actorWallet: params.actorWallet,
      actorRole: params.actorRole,
      actorType: params.actorType,
      action: params.action,
      targetResource: params.targetResource,
      resourceId: params.resourceId,
      capability: params.capability,
      governance: params.governance,
      stateTransition: params.stateTransition,
      timestamp,
      result: params.result,
      evidenceCid: params.evidenceCid || null,
      txHash: params.txHash || null,
      signature: null,
    };

    this.memoryChain.push(entry);
    return entry;
  }

  /**
   * Verifica la integridad matemática de una secuencia de entradas de auditoría.
   */
  public static verifyChainIntegrity(entries: PlatformAuditEntryDTO[]): {
    valid: boolean;
    brokenIndex?: number;
    errorReason?: string;
  } {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;

      // Verificar encadenamiento con el elemento anterior
      if (i > 0) {
        const prev = entries[i - 1];
        if (!prev || entry.prevHash !== prev.currentHash) {
          return {
            valid: false,
            brokenIndex: i,
            errorReason: `Broken link at index ${i}: prevHash does not match previous currentHash`,
          };
        }
      }

      // Recomputar hash actual
      const dataToHash = {
        sequenceNumber: entry.sequenceNumber,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        action: entry.action,
        targetResource: entry.targetResource,
        resourceId: entry.resourceId || null,
        capability: entry.capability,
        stateTransition: entry.stateTransition,
        timestamp: entry.timestamp,
        result: entry.result,
      };

      const expectedHash = this.computeEntryHash(entry.prevHash, dataToHash);
      if (entry.currentHash !== expectedHash) {
        return {
          valid: false,
          brokenIndex: i,
          errorReason: `Hash mismatch at index ${i}: data was tampered with`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Retorna las últimas N entradas de auditoría.
   */
  public static getRecentEntries(limit = 20): PlatformAuditEntryDTO[] {
    return this.memoryChain.slice(-limit).reverse();
  }

  /**
   * Reinicia la cadena para entornos de pruebas.
   */
  public static resetForTesting(): void {
    this.sequenceCounter = 0;
    this.lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
    this.memoryChain.length = 0;
  }
}
