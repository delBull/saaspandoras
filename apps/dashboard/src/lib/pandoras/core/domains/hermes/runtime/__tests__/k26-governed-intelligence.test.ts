/**
 * 🏛️ Pandora's Hermes OS — Milestone K26: Governed Intelligence & Claim Provenance Certification
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/__tests__/k26-governed-intelligence.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClaimContractEngine,
  SNARAI_CANONICAL_CLAIM_CONTRACT,
  TenantClaimContract
} from '../../knowledge/claim-contract-engine';
import { HermesIdentitySigner } from '../../identity/identity-signer';
import { DefaultRuntimePolicyValidator } from '../policy-validator';
import {
  ReasoningContext,
  ReasoningOutput,
  RuntimePolicy
} from '../contracts';

describe("Milestone K26 — Governed Intelligence, Epistemic Claims & IPFS Provenance", () => {
  let validator: DefaultRuntimePolicyValidator;
  let signer: HermesIdentitySigner;

  const baseContext: ReasoningContext = {
    systemRules: ['ADR-011: Hermes Sovereign Cognitive Architecture'],
    governanceRestrictions: ['No guaranteed yields', 'No unverified legal claims'],
    tenantIdentity: {
      agentName: 'Hermes S\'Narai',
      organizationName: 'S\'Narai Riviera Nayarit',
      language: 'es',
    },
    conversationHistory: [],
    activeKnowledge: [],
    activeCapabilities: [],
    currentMessage: { id: 'm1', role: 'USER', content: 'Test query', createdAt: new Date() },
  };

  const RUNTIME_POLICY: RuntimePolicy = {
    allowUnverifiedClaims: false,
    allowRestrictedKnowledge: false,
    allowGovernanceOverrides: false,
    allowUnauthorizedCapabilities: false,
    allowFinancialPromises: false,
    allowRegulatoryClaims: false,
    allowExecutionClaims: false,
  };

  const makeOutput = (content: string): ReasoningOutput => ({
    content,
    meta: {
      provider: 'mock-provider',
      model: 'hermes-k26-test',
      promptTokens: 50,
      completionTokens: 25,
      durationMs: 12,
    },
  });

  beforeEach(() => {
    validator = new DefaultRuntimePolicyValidator();
    signer = new HermesIdentitySigner('0x0123456789012345678901234567890123456789012345678901234567890123');
  });

  // ─── TEST 1: IPFS Claim Contract Anchor & EIP-712 Signature ─────────────────
  it('K26-CLAIM-01: Anchors claim contract to IPFS with Hermes Agent Wallet EIP-712 signature', async () => {
    const anchored = await ClaimContractEngine.anchorClaimContractToIpfs(
      SNARAI_CANONICAL_CLAIM_CONTRACT,
      signer
    );

    expect(anchored.contractHash).toBeDefined();
    expect(anchored.contractHash.length).toBe(64);
    expect(anchored.ipfsCid).toBeDefined();
    expect(anchored.ipfsCid!.startsWith('bafkrei')).toBe(true);
    expect(anchored.ipfsUri).toContain('ipfs://');
    expect(anchored.agentWalletAddress).toBe(signer.getPublicAddress());
    expect(anchored.agentSignature).toBeDefined();
    expect(anchored.agentSignature!.startsWith('0x')).toBe(true);
    expect(anchored.governanceStatus).toBe('ACTIVE');
  });

  // ─── TEST 2: Epistemic Framing — Rejects Historical Data Mutation to Guarantee ──
  it('K26-CLAIM-02: Policy Validator blocks mutation of historical data into a future guarantee', async () => {
    const mutatedOutput = makeOutput(
      "En S'Narai recibirás una tasa garantizada del 15% anual basada en la plusvalía de la zona."
    );

    const result = await validator.validate(mutatedOutput, baseContext, RUNTIME_POLICY, {
      organizationId: 'snarai',
      channel: 'portal',
    });

    expect(result.allowed).toBe(false);
    expect(result.decision.action).toBe('BLOCK');
    expect(result.violations.some(v => v.code === 'EPISTEMIC_MUTATION_TO_GUARANTEE')).toBe(true);
  });

  // ─── TEST 3: Compliant Canonical Fact Assertion ──────────────────────────────
  it('K26-CLAIM-03: Allows canonical positive assertion strictly following allowed claim phrasings', async () => {
    const compliantOutput = makeOutput(
      "S'Narai Riviera Nayarit opera bajo la estructura corporativa de Aztecas Hub S.A.P.I. de C.V. mediante Títulos de Participación desde $50 USD."
    );

    const result = await validator.validate(compliantOutput, baseContext, RUNTIME_POLICY, {
      organizationId: 'snarai',
      channel: 'portal',
    });

    expect(result.allowed).toBe(true);
    expect(result.decision.action).toBe('ALLOW');
  });

  // ─── TEST 4: Verifiable Claim Provenance Receipt ─────────────────────────────
  it('K26-CLAIM-04: Generates a cryptographically verifiable Claim Provenance Receipt with Agent Wallet signature', async () => {
    const outputText = "S'Narai opera bajo la estructura corporativa de Aztecas Hub S.A.P.I. de C.V. con inversión fraccionada en Títulos de Participación desde $50 USD.";

    const receipt = await ClaimContractEngine.generateClaimProvenanceReceipt(
      outputText,
      'snarai',
      signer
    );

    expect(receipt).not.toBeNull();
    expect(receipt!.tenantId).toBe('snarai');
    expect(receipt!.matchedClaimIds).toContain('claim_corporate_entity');
    expect(receipt!.matchedClaimIds).toContain('claim_fractional_units');
    expect(receipt!.proofHash).toBeDefined();
    expect(receipt!.agentSignature).toBeDefined();
    expect(receipt!.agentSignature!.startsWith('0x')).toBe(true);
  });

  // ─── TEST 5: Dynamic External Tenant Claim Contract ──────────────────────────
  it('K26-CLAIM-05: Supports dynamic external tenant claim contracts with custom epistemic constraints', async () => {
    const novaFundContract: TenantClaimContract = {
      tenantId: 'novafund',
      version: 1,
      governanceStatus: 'ACTIVE',
      contractHash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      updatedAt: new Date().toISOString(),
      claims: [
        {
          claimId: 'claim_nova_historical_irr',
          category: 'HISTORICAL_DATA',
          canonicalAssertion: "TIR histórica de proyectos anteriores del 18% en promedio.",
          permittedPhrasings: ['TIR histórica promedio del 18%'],
          forbiddenMutations: [
            /\b(?:aseguramos|garantizamos|retorno fijo de)\s*(?:un\s*)?18%\b/i,
          ],
          provenance: {
            artifactId: 'novafund_historical_audit',
            contentHash: 'aabbccdd0011223344556677889900aabbccddeeff11223344556677889900aabb',
            ipfsCid: 'bafkreinovaaudithistorical0123456789',
            version: 1,
          },
        },
      ],
    };

    ClaimContractEngine.registerContract(novaFundContract);

    // Sub-test A: Block invalid epistemic mutation
    const badNovaOutput = makeOutput("En NovaFund te garantizamos un 18% de retorno anual.");
    const badResult = await validator.validate(badNovaOutput, baseContext, RUNTIME_POLICY, {
      organizationId: 'novafund',
      channel: 'portal',
    });

    expect(badResult.allowed).toBe(false);
    expect(badResult.decision.action).toBe('BLOCK');

    // Sub-test B: Allow compliant historical phrasing
    const goodNovaOutput = makeOutput("NovaFund presenta una TIR histórica promedio del 18% en sus rondas previas.");
    const goodResult = await validator.validate(goodNovaOutput, baseContext, RUNTIME_POLICY, {
      organizationId: 'novafund',
      channel: 'portal',
    });

    expect(goodResult.allowed).toBe(true);
  });
});
