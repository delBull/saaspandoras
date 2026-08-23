/**
 * 🏛️ HERMES OS — Tenant Provisioning & Sovereign Lifecycle Tests
 * src/lib/pandoras/core/domains/hermes/tenants/__tests__/tenant-provisioning.test.ts
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db } from '@/db';
import { hermesClaimContracts } from '@/db/schema';
import { notInArray } from 'drizzle-orm';
import { TenantProvisioner } from '../tenant-provisioner';
import { ClaimContractEngine } from '../../knowledge/claim-contract-engine';
import { TenantResponsePolicyGate } from '../../runtime/policy/tenant-response-policy';
import { HermesIdentitySigner } from '../../identity/identity-signer';
import { DefaultRuntimePolicyValidator } from '../../runtime/policy-validator';

describe('Hermes OS Milestone K27 — External Tenant Provisioning & Dynamic Sovereignty', () => {
  const testTenant = `acme_realty_${Date.now()}`;
  const signer = new HermesIdentitySigner();

  it('PROV-001: Provisions deterministic FACT claims and custom claims into ClaimContractEngine', async () => {
    const result = await TenantProvisioner.provisionTenantIntelligence(
      {
        tenantId: testTenant,
        organizationName: 'Acme Realty Corp',
        agentName: 'Acme AI',
        projectMetadata: {
          tokenPriceUsd: 120,
          totalSupply: 5000,
          location: 'Tulum, Quintana Roo',
          legalEntity: 'Acme Developments S.A.P.I.',
          websiteUrl: 'https://acmerealty.com',
        },
        customClaims: [
          {
            claimId: 'claim_amenities',
            category: 'FACT',
            canonicalAssertion: 'El complejo cuenta con alberca infinity y acceso a playa privada.',
            permittedPhrasings: ['alberca infinity', 'playa privada'],
            disclosureClearance: 'PUBLIC',
          },
        ],
        forbiddenTerms: ['ganancia asegurada', '100% libre de riesgo'],
      },
      { overrideSigner: signer, skipDb: true }
    );

    expect(result.tenantId).toBe(testTenant);
    expect(result.claimsCount).toBe(5); // 4 deterministic + 1 custom
    expect(result.status).toBe('ACTIVE');
    expect(result.claimContractCid).toBeDefined();

    // Verify contract is immediately loaded in ClaimContractEngine
    const loadedContract = ClaimContractEngine.getContract(testTenant);
    expect(loadedContract).toBeDefined();
    expect(loadedContract?.claims.length).toBe(5);

    // Verify coverage evaluation works for the newly provisioned tenant
    const validText = 'Acme Realty está ubicado en Tulum, Quintana Roo con precio oficial de preventa de $120 USD por token.';
    const coverage = ClaimContractEngine.evaluateClaimCoverage(validText, testTenant);
    expect(coverage.complete).toBe(true);
    expect(coverage.unsupportedSegments.length).toBe(0);
  });

  it('PROV-002: Dynamic Policy Gate registers and blocks forbidden assertions for the new tenant', async () => {
    const policyResult = TenantResponsePolicyGate.evaluate(
      'Invierte hoy y obtén un retorno 100% libre de riesgo en tu departamento.',
      testTenant
    );

    expect(policyResult.action).toBe('BLOCK');
    expect(policyResult.allowed).toBe(false);
    expect(policyResult.violations.length).toBeGreaterThan(0);
    expect(policyResult.violations[0]?.message).toContain('100% libre de riesgo');
  });

  it('PROV-003: Dynamic Soul Resolver builds complete AgentSoul without hardcoded files', async () => {
    const soul = TenantProvisioner.resolveTenantSoul({
      tenantId: testTenant,
      version: 1,
      agentName: 'Acme Assistant',
      organizationName: 'Acme Realty Corp',
      persona: 'Especialista en Inversiones Inmobiliarias',
      voice: 'Sofisticado y profesional',
      tone: { dos: ['Citar amenidades'], donts: ['Prometer retornos'] },
      languagePolicy: {
        avoidAsDefault: ['ganancia asegurada'],
        preferred: { 'ganancia asegurada': 'proyección estimada' },
        allowedWhenAsked: ['historial de plusvalía'],
      },
      claimsPolicy: {
        prohibited: ['ganancia asegurada'],
        requiredQualification: ['plusvalía'],
      },
      escalationPolicy: {
        legalQuestions: 'ESCALATE',
        taxQuestions: 'ESCALATE',
        customInvestmentAdvice: 'ESCALATE',
        unavailableProjectData: 'ESCALATE',
        founderRequest: 'ESCALATE',
        outOfScopeQuestion: 'ANSWER',
      },
      canonicalUrls: { website: 'https://acmerealty.com' },
      closingSignature: '— Equipo Acme Realty',
    });

    expect(soul.projectSlug).toBe(testTenant);
    expect(soul.agentName).toBe('Acme Assistant');
    expect(soul.closingSignature).toBe('— Equipo Acme Realty');
    expect(soul.canonicalUrls.website).toBe('https://acmerealty.com');
  });

  it('PROV-004: Generates valid ClaimProvenanceReceipt for newly provisioned tenant', async () => {
    const text = 'El complejo cuenta con alberca infinity y acceso a playa privada.';
    const receipt = await ClaimContractEngine.generateClaimProvenanceReceipt(
      text,
      testTenant,
      signer,
      { explicitTier: 'LEVEL_3_FINANCIAL_CONTRACTUAL' }
    );

    expect(receipt).toBeDefined();
    expect(receipt?.tenantId).toBe(testTenant);
    expect(receipt?.claims.length).toBeGreaterThan(0);

    const verification = ClaimContractEngine.verifyReceipt(receipt!, text, {
      expectedTenantId: testTenant,
      expectedSignerAddress: signer.getPublicAddress(),
    });
    expect(verification.valid).toBe(true);
  });

  afterAll(async () => {
    if (db) {
      try {
        await db
          .delete(hermesClaimContracts)
          .where(notInArray(hermesClaimContracts.tenantId, ['snarai', 'org_snarai', 'pandoras', 'org_pandoras']));
      } catch (err) {
        // Ignore in offline environments
      }
    }
  });
});
