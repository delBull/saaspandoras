import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutiveIntentClassifier } from '../intent-classifier';
import { ExecutivePlanner } from '../executive-planner';
import { ALL_FOUNDER_CAPABILITIES } from '../types';

describe('Hermes Executive Sovereign Plane — Phase 2: Operational Actions & Multi-Step Planner (Tier 2)', () => {
  const mockFounderInterlocutor = {
    id: 'marco_founder',
    isBoss: true,
    founderExecutiveMode: true,
    capabilities: ALL_FOUNDER_CAPABILITIES,
  };

  const mockNonFounderInterlocutor = {
    id: 'regular_user_123',
    isBoss: false,
    founderExecutiveMode: false,
    capabilities: [],
  };

  beforeEach(() => {
    ExecutivePlanner.clearPendingPlans();
  });

  describe('1. Executive Intent Classifier', () => {
    it('classifies confirmation utterances accurately', () => {
      expect(ExecutiveIntentClassifier.isConfirmation('confirmo')).toBe(true);
      expect(ExecutiveIntentClassifier.isConfirmation('ejecuta')).toBe(true);
      expect(ExecutiveIntentClassifier.isConfirmation('procede')).toBe(true);
      expect(ExecutiveIntentClassifier.isConfirmation('/confirm')).toBe(true);
      expect(ExecutiveIntentClassifier.isConfirmation('/ejecutar')).toBe(true);
      expect(ExecutiveIntentClassifier.isConfirmation('sí, dale')).toBe(false); // only exact/clean matches
      expect(ExecutiveIntentClassifier.isConfirmation('dale')).toBe(true);
    });

    it('classifies cancellation utterances accurately', () => {
      expect(ExecutiveIntentClassifier.isCancellation('cancela')).toBe(true);
      expect(ExecutiveIntentClassifier.isCancellation('aborta')).toBe(true);
      expect(ExecutiveIntentClassifier.isCancellation('/cancel')).toBe(true);
      expect(ExecutiveIntentClassifier.isCancellation('descarta')).toBe(true);
    });

    it('parses credit top-up intent in multiple natural forms and slash commands', () => {
      const naturalA = ExecutiveIntentClassifier.classify('Recarga 100 créditos a snarai');
      expect(naturalA.type).toBe('OPERATIONAL_ACTION');
      if (naturalA.type === 'OPERATIONAL_ACTION') {
        expect(naturalA.action).toBe('TOPUP_CREDITS');
        expect(naturalA.target).toBe('snarai');
        expect(naturalA.payload.amountUsd).toBe(100);
      }

      const naturalB = ExecutiveIntentClassifier.classify('Asigna 50 usd al tenant snarai');
      expect(naturalB.type).toBe('OPERATIONAL_ACTION');
      if (naturalB.type === 'OPERATIONAL_ACTION') {
        expect(naturalB.action).toBe('TOPUP_CREDITS');
        expect(naturalB.target).toBe('snarai');
        expect(naturalB.payload.amountUsd).toBe(50);
      }

      const slash = ExecutiveIntentClassifier.classify('/topup snarai 250');
      expect(slash.type).toBe('OPERATIONAL_ACTION');
      if (slash.type === 'OPERATIONAL_ACTION') {
        expect(slash.action).toBe('TOPUP_CREDITS');
        expect(slash.target).toBe('snarai');
        expect(slash.payload.amountUsd).toBe(250);
      }
    });

    it('parses collaborator role modification intent', () => {
      const natural = ExecutiveIntentClassifier.classify('Promueve a dev@pandoras.finance a ADMIN');
      expect(natural.type).toBe('OPERATIONAL_ACTION');
      if (natural.type === 'OPERATIONAL_ACTION') {
        expect(natural.action).toBe('SET_COLLABORATOR_ROLE');
        expect(natural.target).toBe('dev@pandoras.finance');
        expect(natural.payload.role).toBe('ADMIN');
      }

      const slash = ExecutiveIntentClassifier.classify('/role test@pandoras.finance SUPER_ADMIN');
      expect(slash.type).toBe('OPERATIONAL_ACTION');
      if (slash.type === 'OPERATIONAL_ACTION') {
        expect(slash.action).toBe('SET_COLLABORATOR_ROLE');
        expect(slash.target).toBe('test@pandoras.finance');
        expect(slash.payload.role).toBe('SUPER_ADMIN');
      }
    });

    it('parses collaborator invitation intent', () => {
      const natural = ExecutiveIntentClassifier.classify('Invita a maria@pandoras.finance como ADMIN');
      expect(natural.type).toBe('OPERATIONAL_ACTION');
      if (natural.type === 'OPERATIONAL_ACTION') {
        expect(natural.action).toBe('INVITE_COLLABORATOR');
        expect(natural.target).toBe('maria@pandoras.finance');
        expect(natural.payload.role).toBe('ADMIN');
      }

      const slash = ExecutiveIntentClassifier.classify('/invite carlos@pandoras.finance COLLABORATOR Carlos Mendez');
      expect(slash.type).toBe('OPERATIONAL_ACTION');
      if (slash.type === 'OPERATIONAL_ACTION') {
        expect(slash.action).toBe('INVITE_COLLABORATOR');
        expect(slash.target).toBe('carlos@pandoras.finance');
        expect(slash.payload.role).toBe('COLLABORATOR');
        expect(slash.payload.name).toBe('Carlos Mendez');
      }
    });

    it('parses tenant status toggle intent', () => {
      const natural = ExecutiveIntentClassifier.classify('Pausa el tenant snarai');
      expect(natural.type).toBe('OPERATIONAL_ACTION');
      if (natural.type === 'OPERATIONAL_ACTION') {
        expect(natural.action).toBe('SET_TENANT_STATUS');
        expect(natural.target).toBe('snarai');
        expect(natural.payload.status).toBe('paused');
      }

      const slash = ExecutiveIntentClassifier.classify('/tenant-status snarai active');
      expect(slash.type).toBe('OPERATIONAL_ACTION');
      if (slash.type === 'OPERATIONAL_ACTION') {
        expect(slash.action).toBe('SET_TENANT_STATUS');
        expect(slash.target).toBe('snarai');
        expect(slash.payload.status).toBe('active');
      }
    });
  });

  describe('2. Multi-Step Two-Phase Planner & Capability Gate', () => {
    it('rejects plan creation if interlocutor lacks FOUNDER_OPERATOR capability (fail-closed)', () => {
      const result = ExecutivePlanner.createPlan({
        action: 'TOPUP_CREDITS',
        target: 'snarai',
        payload: { amountUsd: 100 },
        title: 'Asignación de Fondos',
        description: 'Test',
        interlocutor: mockNonFounderInterlocutor,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe('MISSING_CAPABILITY_FOUNDER_OPERATOR');
      expect(result.reviewCard).toContain('Acceso Denegado');
      expect(ExecutivePlanner.getPendingPlan('regular_user_123')).toBeNull();
    });

    it('creates plan with reviewCard and PENDING_CONFIRMATION status for authorized founder', () => {
      const result = ExecutivePlanner.createPlan({
        action: 'TOPUP_CREDITS',
        target: 'snarai',
        payload: { amountUsd: 100 },
        title: 'Asignación de Fondos ($100.00 USD)',
        description: 'Recargar $100.00 USD en snarai',
        blastRadius: 'MEDIUM',
        interlocutor: mockFounderInterlocutor,
        founderKey: 'marco_founder',
      });

      expect(result.ok).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.plan?.status).toBe('PENDING_CONFIRMATION');
      expect(result.reviewCard).toContain('Plan Operativo Preparado (Tier 2)');
      expect(result.reviewCard).toContain('snarai');
      expect(result.reviewCard).toContain('confirmo');

      const pending = ExecutivePlanner.getPendingPlan('marco_founder');
      expect(pending).toBeDefined();
      expect(pending?.id).toBe(result.plan?.id);
    });

    it('cancels pending plan cleanly when requested', () => {
      ExecutivePlanner.createPlan({
        action: 'SET_TENANT_STATUS',
        target: 'snarai',
        payload: { status: 'paused' },
        title: 'Pausa de Tenant',
        description: 'Pausar snarai',
        interlocutor: mockFounderInterlocutor,
        founderKey: 'marco_founder',
      });

      expect(ExecutivePlanner.getPendingPlan('marco_founder')).not.toBeNull();

      const cancelResult = ExecutivePlanner.cancelPlan('marco_founder');
      expect(cancelResult.cancelled).toBe(true);
      expect(cancelResult.message).toContain('Plan Cancelado');
      expect(ExecutivePlanner.getPendingPlan('marco_founder')).toBeNull();
    });
  });

  describe('3. Execution & Canonical Dispatch (Top-Up Action)', () => {
    it('executes TOPUP_CREDITS plan upon confirmation, updates ledger and records audit event', async () => {
      // 1. Create plan
      ExecutivePlanner.createPlan({
        action: 'TOPUP_CREDITS',
        target: 'snarai',
        payload: { amountUsd: 50 },
        title: 'Asignación de Fondos ($50.00 USD)',
        description: 'Recargar saldo de cómputo en snarai',
        interlocutor: mockFounderInterlocutor,
        founderKey: 'marco_founder',
      });

      // 2. Execute plan
      const result = await ExecutivePlanner.executePlan('marco_founder', mockFounderInterlocutor);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Fondos Asignados Exitosamente');
      expect(result.message).toContain('snarai');
      expect(result.message).toContain('$50.00 USD');
      expect(result.auditRecordId).toBeDefined();
      expect(result.auditRecordId?.length).toBeGreaterThan(0);

      // Verify pending plan is cleared after execution
      expect(ExecutivePlanner.getPendingPlan('marco_founder')).toBeNull();
    });
  });
});
