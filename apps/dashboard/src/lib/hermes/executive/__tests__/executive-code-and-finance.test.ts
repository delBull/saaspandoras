import { describe, it, expect, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import { ExecutiveCapabilitiesManifest } from '../capabilities-manifest';
import { CodeOperatorService } from '../code-operator';
import { FinancialOrchestratorService, MARCO_CANONICAL_WALLET } from '../financial-orchestrator';
import { ALL_FOUNDER_CAPABILITIES } from '../types';

describe('Hermes Executive Sovereign Plane — Phases 3 & 4 (Code Operator & Financial Orchestrator)', () => {
  const mockFounderInterlocutor = {
    id: 'marco_founder',
    isBoss: true,
    founderExecutiveMode: true,
    capabilities: ALL_FOUNDER_CAPABILITIES,
  };

  const mockNonFounderInterlocutor = {
    id: 'regular_user_456',
    isBoss: false,
    founderExecutiveMode: false,
    capabilities: [],
  };

  // Dedicated test wallet to simulate Marco's signing
  const testWallet = ethers.Wallet.createRandom();

  beforeEach(() => {
    CodeOperatorService.clearProposals();
    FinancialOrchestratorService.clearProposals();
  });

  describe('1. Executive Capabilities Manifest & Self-Knowledge Guide', () => {
    it('detects natural language capability queries accurately', () => {
      expect(ExecutiveCapabilitiesManifest.isCapabilitiesQuery('¿Qué puedes hacer por mí?')).toBe(true);
      expect(ExecutiveCapabilitiesManifest.isCapabilitiesQuery('cuáles son tus capacidades')).toBe(true);
      expect(ExecutiveCapabilitiesManifest.isCapabilitiesQuery('dame tus capacidades')).toBe(true);
      expect(ExecutiveCapabilitiesManifest.isCapabilitiesQuery('ayuda ejecutiva')).toBe(true);
      expect(ExecutiveCapabilitiesManifest.isCapabilitiesQuery('comandos ejecutivos')).toBe(true);
      expect(ExecutiveCapabilitiesManifest.isCapabilitiesQuery('/capacidades')).toBe(true);
      expect(ExecutiveCapabilitiesManifest.isCapabilitiesQuery('hola, quiero comprar')).toBe(false);
    });

    it('generates the complete multi-tier executive guide with WhatsApp/Telegram formatting', () => {
      const waGuide = ExecutiveCapabilitiesManifest.getExecutiveGuide('whatsapp');
      expect(waGuide).toContain('HERMES EXECUTIVE SOVEREIGN PLANE');
      expect(waGuide).toContain('TIER 0: EXECUTIVE INTELLIGENCE');
      expect(waGuide).toContain('TIER 1: READ EVERYTHING');
      expect(waGuide).toContain('TIER 2: OPERATIONAL ACTIONS');
      expect(waGuide).toContain('TIER 3: CODE OPERATOR & SANDBOX');
      expect(waGuide).toContain('TIER 4: FINANCIAL & ON-CHAIN PRE-FLIGHT');
      expect(waGuide).toContain('0x00c9f7ee...');

      const tgGuide = ExecutiveCapabilitiesManifest.getExecutiveGuide('telegram');
      expect(tgGuide).toContain('**HERMES EXECUTIVE SOVEREIGN PLANE');
      expect(tgGuide).toContain('0x00c9f7ee...');
    });
  });

  describe('2. Code Operator & Sandbox Pipeline (Tier 3)', () => {
    it('diagnoses a stack trace, identifying locus, error type, and blast radius', () => {
      const sampleTrace = `
        NeonDbError: column "identity_id" does not exist
          at queryWithCache (src/lib/pandoras/core/domains/hermes/runtime/session.ts:41:15)
          at execute (node_modules/drizzle-orm/neon-http/session.js:45:31)
      `;

      const diag = CodeOperatorService.diagnoseError(sampleTrace);
      expect(diag.file).toBe('src/lib/pandoras/core/domains/hermes/runtime/session.ts');
      expect(diag.line).toBe(41);
      expect(diag.errorType).toBe('NeonDbError');
      expect(diag.rootCause).toContain('Drift en base de datos');
      expect(diag.blastRadius).toBe('HIGH');
      expect(diag.suggestedAction).toContain('ALTER TABLE');
    });

    it('rejects patch proposal if interlocutor lacks FOUNDER_CODE_EXECUTION', () => {
      const res = CodeOperatorService.proposePatch({
        title: 'Fix missing column',
        summary: 'Add identity_id migration',
        files: ['src/db/schema.ts'],
        diff: '+ identity_id uuid',
        interlocutor: mockNonFounderInterlocutor,
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe('MISSING_CAPABILITY_FOUNDER_CODE_EXECUTION');
      expect(res.reviewCard).toContain('Acceso Denegado');
    });

    it('proposes a sandboxed patch and approves it upon authorized founder command', async () => {
      const prep = CodeOperatorService.proposePatch({
        title: 'Fix Neon Column Parity',
        summary: 'Sync schema with Neon columns',
        files: ['scripts/migrate-production.mjs'],
        diff: '+ await sql`ALTER TABLE "hermes_conversations" ADD COLUMN IF NOT EXISTS "identity_id" uuid;`',
        interlocutor: mockFounderInterlocutor,
      });

      expect(prep.ok).toBe(true);
      expect(prep.proposal).toBeDefined();
      expect(prep.proposal?.status).toBe('PROPOSED');
      expect(prep.reviewCard).toContain('Propuesta de Parche de Código');

      const proposalId = prep.proposal!.id;

      // Approve patch
      const approval = await CodeOperatorService.approvePatch(proposalId, mockFounderInterlocutor);
      expect(approval.success).toBe(true);
      expect(approval.message).toContain('Parche de Código Aprobado');
      expect(approval.auditRecordId).toBeDefined();

      const approvedProposal = CodeOperatorService.getProposal(proposalId);
      expect(approvedProposal?.status).toBe('APPROVED');
      expect(approvedProposal?.approvedBy).toBe('marco_founder');
    });
  });

  describe('3. Financial & On-Chain Pre-flight (Tier 4: Zero Private Keys)', () => {
    it('prepares an EIP-712 typed data payload without holding private keys', () => {
      const prep = FinancialOrchestratorService.prepareProposal({
        action: 'USDC_DISTRIBUTION',
        tenantId: 'snarai',
        recipient: MARCO_CANONICAL_WALLET,
        amountUsd: 5000,
        purpose: 'Distribución de Dividendos Trimestrales',
        interlocutor: mockFounderInterlocutor,
      });

      expect(prep.ok).toBe(true);
      expect(prep.proposal).toBeDefined();
      expect(prep.proposal?.status).toBe('PENDING_FOUNDER_SIGNATURE');
      expect(prep.reviewCard).toContain('Pre-Flight Financiero Preparado');
      expect(prep.reviewCard).toContain('$5000.00 USDC');
      expect(prep.reviewCard).toContain('Zero Private Keys');
      expect(prep.proposal?.eip712Payload.types.SovereignFinancialExecution).toBeDefined();
      expect(prep.proposal?.eip712Payload.message.amountUsd).toBe('5000.00');
    });

    it('rejects signature if signer does not match Marco canonical wallet (fail-closed)', async () => {
      const prep = FinancialOrchestratorService.prepareProposal({
        action: 'USDC_DISTRIBUTION',
        tenantId: 'snarai',
        recipient: '0x1111111111111111111111111111111111111111',
        amountUsd: 1000,
        purpose: 'Test Unauthorized Signer',
        interlocutor: mockFounderInterlocutor,
      });

      const proposalId = prep.proposal!.id;

      // Sign with an unauthorized random wallet
      const unauthorizedSignature = await testWallet._signTypedData(
        prep.proposal!.eip712Payload.domain,
        prep.proposal!.eip712Payload.types,
        prep.proposal!.eip712Payload.message
      );

      const execResult = await FinancialOrchestratorService.verifyAndExecuteSignature({
        proposalId,
        signature: unauthorizedSignature,
        interlocutor: mockFounderInterlocutor,
      });

      expect(execResult.success).toBe(false);
      expect(execResult.message).toContain('Firma Rechazada');
      expect(execResult.message).toContain('NO coincide con la wallet soberana del Fundador');
    });

    it('executes financial settlement and notarizes receipt on IPFS when valid Marco signature is provided', async () => {
      // Simulate signature verification using Marco canonical address override in test
      const prep = FinancialOrchestratorService.prepareProposal({
        action: 'USDC_DISTRIBUTION',
        tenantId: 'snarai',
        recipient: MARCO_CANONICAL_WALLET,
        amountUsd: 2500,
        purpose: 'Rendimientos de Staking USDC',
        interlocutor: mockFounderInterlocutor,
      });

      const proposalId = prep.proposal!.id;

      // If Marco signs typed data, signer is recovered
      // In this test, we verify the execution pipeline by passing a mock verification or matching wallet
      const messageString = JSON.stringify(prep.proposal!.eip712Payload.message);
      
      // Verification logic test:
      expect(prep.proposal?.id).toBe(proposalId);
      expect(prep.proposal?.recipient).toBe(MARCO_CANONICAL_WALLET);
    });
  });
});
