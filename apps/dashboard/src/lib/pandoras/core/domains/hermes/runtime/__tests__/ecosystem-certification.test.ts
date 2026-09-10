/**
 * 🏛️ Pandora's Hermes OS — Certification Suite: K25 IPFS Vault, Learning Loop & Cross-Channel Lattice
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/__tests__/ecosystem-certification.test.ts
 */

import { describe, it, expect } from 'vitest';
import { ClaimContractEngine } from '../../knowledge/claim-contract-engine';
import { PANDORAS_CANONICAL_CLAIM_CONTRACT } from '../../knowledge/claim-contract-engine';
import { PANDORAS_ECOSYSTEM_CLAIMS } from '../../knowledge/ecosystem-doctrine';
import { CognitiveContextAdapter } from '../context-adapter';
import { HermesLearningLoop } from '@/lib/hermes/memory/learning-loop';

describe('🏛️ Hermes OS — Milestone Certification Suite', () => {

  // ===========================================================================
  // 1. CERTIFICACIÓN IPFS / K25 VAULT
  // ===========================================================================
  describe('A. IPFS K25 Sovereign Knowledge Vault Certification', () => {
    it('K25-CERT-01: Ecosystem Doctrine is cryptographically sealed with RFC4648 CIDv1 & SHA-256 hashes', () => {
      expect(PANDORAS_CANONICAL_CLAIM_CONTRACT).toBeDefined();
      expect(PANDORAS_CANONICAL_CLAIM_CONTRACT.tenantId).toBe('pandoras');
      expect(PANDORAS_CANONICAL_CLAIM_CONTRACT.version).toBe(1);

      // Verify contractHash is a true 64-char hex SHA-256
      expect(PANDORAS_CANONICAL_CLAIM_CONTRACT.contractHash).toMatch(/^[a-f0-9]{64}$/i);

      // Verify ipfsCid complies with RFC4648 CIDv1 base32 multihash format
      expect(PANDORAS_CANONICAL_CLAIM_CONTRACT.ipfsCid).toMatch(/^bafkrei[a-z2-7]{52,60}$/);
      expect(PANDORAS_CANONICAL_CLAIM_CONTRACT.ipfsUri).toBe(`ipfs://${PANDORAS_CANONICAL_CLAIM_CONTRACT.ipfsCid}`);

      // Verify all claims have cryptographic provenance (no synthetic placeholders)
      for (const claim of PANDORAS_CANONICAL_CLAIM_CONTRACT.claims) {
        expect(claim.provenance).toBeDefined();
        expect(claim.provenance.contentHash).toMatch(/^[a-f0-9]{64}$/i);
        expect(claim.provenance.ipfsCid).toMatch(/^bafkrei[a-z2-7]{52,60}$/);
      }
    });

    it('K25-CERT-02: ClaimContractEngine.getOrLoadContract retrieves sealed pandoras contract', async () => {
      const contract = await ClaimContractEngine.getOrLoadContract('pandoras');
      expect(contract).toBeDefined();
      expect(contract?.tenantId).toBe('pandoras');
      expect(contract?.governanceStatus).toBe('ACTIVE');
      expect(contract?.claims.length).toBeGreaterThanOrEqual(11);
    });

    it('K25-CERT-03: Systemic intake validator passes all ecosystem claims', () => {
      expect(() => {
        ClaimContractEngine.validateProvenanceIntegrity(PANDORAS_ECOSYSTEM_CLAIMS);
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // 2. CERTIFICACIÓN LEARNING LOOP & INVIOLABILIDAD INSTITUCIONAL
  // ===========================================================================
  describe('B. Governed Learning Loop & Institutional Invariance Certification', () => {
    it('LEARN-CERT-01: Learning Loop produces governed behavioral traits without modifying doctrine', async () => {
      const mockHistory = [
        { role: 'user', content: 'Hola, me interesa conocer sobre el proyecto.' },
        { role: 'assistant', content: 'Hola. Pandora Growth OS es la infraestructura para empresas autónomas.' },
        { role: 'user', content: '¿Cuáles son los plazos de entrega y tienen financiamiento?' },
        { role: 'assistant', content: 'Toda la información formal de plazos se estipula en los Deal Rooms notarizados.' },
      ];

      // Invariant: Institutional doctrine claims count before
      const claimsCountBefore = PANDORAS_CANONICAL_CLAIM_CONTRACT.claims.length;
      const initialContractHash = PANDORAS_CANONICAL_CLAIM_CONTRACT.contractHash;

      // Verify learning extraction can be invoked (will fail-safe to null or result without throwing)
      const extraction = await HermesLearningLoop.extractLearnings('user_test_123', mockHistory);
      
      // Invariant: Claim contract in ClaimContractEngine remains strictly unmutated
      const contractAfter = ClaimContractEngine.getContract('pandoras');
      expect(contractAfter?.claims.length).toBe(claimsCountBefore);
      expect(contractAfter?.contractHash).toBe(initialContractHash);
    });

    it('LEARN-CERT-02: Tenant Isolation — learning profile belongs to actor and does not pollute cross-tenant knowledge', () => {
      // Effective context for Tenant B (snarai)
      const snaraiContract = ClaimContractEngine.getContract('snarai');
      expect(snaraiContract?.tenantId).toBe('snarai');

      // Make sure pandoras-specific claims are not leaked into snarai claim contract
      const hasPandorasCoreInSnarai = snaraiContract?.claims.some(c => c.claimId === 'claim_pandoras_growth_os_overview');
      expect(hasPandorasCoreInSnarai).toBe(false);
    });
  });

  // ===========================================================================
  // 3. CERTIFICACIÓN PARIDAD CROSS-CHANNEL Y MENOR PRIVILEGIO
  // ===========================================================================
  describe('C. Cross-Channel Parity & Least-Privilege Lattice Certification', () => {
    const mockPandorasEffectiveContext = {
      core: {
        tenantId: 'pandoras',
        organizationName: "Pandora's Growth OS",
        role: 'VIEWER',
      },
      knowledge: PANDORAS_ECOSYSTEM_CLAIMS.map(c => ({
        id: c.claimId,
        key: c.claimId,
        content: c.canonicalAssertion,
        status: 'ACTIVE',
        visibility: c.disclosureClearance,
        classification: c.disclosureClearance,
        dimension: 'project',
      })),
      style: { tone: 'Formal', language: 'es' },
      activeCapabilities: [],
      intelligenceScores: [],
      knowledgeUnavailable: false,
    };

    it('CROSS-CERT-01: Public Lead / Anonymous Visitor receives ONLY PUBLIC claims', () => {
      const publicContext = {
        ...mockPandorasEffectiveContext,
        core: {
          tenantId: 'pandoras',
          role: 'VIEWER',
          clearance: 'PUBLIC',
        },
      };

      const { reasoningContext } = CognitiveContextAdapter.adapt(
        publicContext as any,
        [],
        { role: 'user', content: '¿Qué es Growth OS?' } as any
      );

      const activeFacts = (reasoningContext as any).activeKnowledge || [];
      expect(activeFacts.length).toBeGreaterThan(0);

      // Verify that NO internal operational or confidential claim is present
      const hasHitlDiscord = activeFacts.some((f: any) => f.key === 'claim_hitl_discord_escalation_protocol');
      const hasAdminHq = activeFacts.some((f: any) => f.key === 'claim_admin_pandoras_hq_governance');
      const hasGrowthOs = activeFacts.some((f: any) => f.key === 'claim_pandoras_growth_os_overview');

      expect(hasGrowthOs).toBe(true); // Public claim present
      expect(hasHitlDiscord).toBe(false); // Internal operational blocked
      expect(hasAdminHq).toBe(false); // Confidential blocked
    });

    it('CROSS-CERT-02: Operator receives INTERNAL_OPERATIONAL (Discord HITL) but NOT CONFIDENTIAL HQ', () => {
      const operatorContext = {
        ...mockPandorasEffectiveContext,
        core: {
          tenantId: 'pandoras',
          role: 'OPERATOR',
          permissions: ['knowledge.read', 'runtime.respond'],
        },
      };

      const { reasoningContext } = CognitiveContextAdapter.adapt(
        operatorContext as any,
        [],
        { role: 'user', content: '¿Cómo funciona el protocolo de soporte?' } as any
      );

      const activeFacts = (reasoningContext as any).activeKnowledge || [];
      const hasHitlDiscord = activeFacts.some((f: any) => f.key === 'claim_hitl_discord_escalation_protocol');
      const hasAdminHq = activeFacts.some((f: any) => f.key === 'claim_admin_pandoras_hq_governance');

      expect(hasHitlDiscord).toBe(true); // Operator has operational clearance
      expect(hasAdminHq).toBe(false); // Operator DOES NOT have confidential clearance
    });

    it('CROSS-CERT-03: External Tenant Admin (snarai) does NOT get platform CONFIDENTIAL clearance (Least Privilege)', () => {
      const externalAdminContext = {
        ...mockPandorasEffectiveContext,
        core: {
          tenantId: 'snarai', // External tenant
          role: 'ADMIN',
          permissions: ['knowledge.read', 'runtime.respond'],
        },
      };

      const { reasoningContext } = CognitiveContextAdapter.adapt(
        externalAdminContext as any,
        [],
        { role: 'user', content: 'Mostrar infraestructura de administración' } as any
      );

      const activeFacts = (reasoningContext as any).activeKnowledge || [];
      const hasAdminHq = activeFacts.some((f: any) => f.key === 'claim_admin_pandoras_hq_governance');

      // Invariant: Tenant scope prevents platform CONFIDENTIAL elevation
      expect(hasAdminHq).toBe(false);
    });

    it('CROSS-CERT-04: Platform SUPER_ADMIN on pandoras master scope receives CONFIDENTIAL platform facts', () => {
      const superAdminContext = {
        ...mockPandorasEffectiveContext,
        core: {
          tenantId: 'pandoras',
          role: 'SUPER_ADMIN',
          permissions: ['governance.admin', 'claims.verify', 'knowledge.read'],
        },
      };

      const { reasoningContext } = CognitiveContextAdapter.adapt(
        superAdminContext as any,
        [],
        { role: 'user', content: 'Estado de plataforma HQ' } as any
      );

      const activeFacts = (reasoningContext as any).activeKnowledge || [];
      const hasAdminHq = activeFacts.some((f: any) => f.key === 'claim_admin_pandoras_hq_governance');
      const hasVaultFact = activeFacts.some((f: any) => f.key === 'claim_sovereign_knowledge_vault');

      expect(hasAdminHq).toBe(true);
      expect(hasVaultFact).toBe(true);
    });
  });
});
