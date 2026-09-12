/**
 * Hermes Real Estate Provisioner Tests — Phase 5
 * src/lib/real-estate/__tests__/real-estate-provisioner.test.ts
 */

import { describe, it, expect } from 'vitest';
import { RealEstateProvisioner } from '../real-estate-provisioner';
import { HermesIdentitySigner } from '@/lib/pandoras/core/domains/hermes/identity/identity-signer';
import { ClaimContractEngine } from '@/lib/pandoras/core/domains/hermes/knowledge/claim-contract-engine';
import { TenantResponsePolicyGate } from '@/lib/pandoras/core/domains/hermes/runtime/policy/tenant-response-policy';
import { HermesSoulRegistry } from '@/lib/hermes/soul/snarai-soul';

describe('Hermes Real Estate Pack — Phase 5: Tenant Provisioning Integration', () => {
  const signer = new HermesIdentitySigner();
  const testTenant = `tulum_palms_${Date.now()}`;

  it('PROV-RE-001: Provisions a new real estate development into Hermes OS with zero code compilation', async () => {
    const result = await RealEstateProvisioner.provisionRealEstateDevelopment(
      {
        tenantSlug: testTenant,
        developmentName: 'Tulum Palms Luxury Villas',
        experienceTemplate: 'LUXURY',
        tokenPriceUsd: 150,
        totalSupply: 4000,
        dataRoomUrl: 'https://dataroom.pandoras.finance/tulum-palms',
        knowledge: {
          developmentName: 'Tulum Palms Luxury Villas',
          location: 'Región 15, Tulum, Quintana Roo',
          legalStructure: 'FIDUCIARY_TRUST',
          legalStructureDescription: 'Fideicomiso Maestro en Banco Actinver',
          developerCompany: 'Palms Development Group',
          propertyTypesOffered: ['VILLA', 'FRACTIONAL'],
          commercialStage: 'PRESALE_EARLY_BIRD',
          estimatedDeliveryDate: 'Diciembre 2026',
          estimatedAppreciationPercentage: '24% proyectada en etapa temprana',
          rentalPoolEnabled: true,
          approvedDocuments: [
            {
              title: 'Contrato de Fideicomiso',
              category: 'LEGAL',
              documentUrl: 'https://dataroom.pandoras.finance/tulum-palms/fideicomiso.pdf',
              isPublicInDataRoom: true,
            },
          ],
        },
      },
      {
        overrideSigner: signer,
        skipDb: true,
      }
    );

    expect(result.success).toBe(true);
    expect(result.tenantSlug).toBe(testTenant);
    expect(result.experienceTemplate).toBe('LUXURY');
    expect(result.templateDefinition.theme.darkLuxury).toBe(true);
    expect(result.claimsCount).toBe(10); // 4 deterministic metadata + 5 doctrines + 1 safe harbor
    expect(result.claimContractCid).toBeDefined();

    // Verify ClaimContractEngine holds the anchored contract
    const contract = ClaimContractEngine.getContract(testTenant);
    expect(contract).toBeDefined();
    expect(contract?.claims.length).toBe(10);
  });

  it('PROV-RE-002: Dynamic Policy Gate blocks unauthorized financial promises for the provisioned tenant', async () => {
    const policyResult = TenantResponsePolicyGate.evaluate(
      'Compra tu villa hoy y obtén un rendimiento financiero garantizado del 20% mensual.',
      testTenant
    );

    expect(policyResult.action).toBe('BLOCK');
    expect(policyResult.allowed).toBe(false);
    expect(policyResult.violations.length).toBeGreaterThan(0);
    expect(policyResult.violations[0]?.message).toContain('rendimiento financiero garantizado');
  });

  it('PROV-RE-003: Registered Tenant Soul is accessible via HermesSoulRegistry', async () => {
    const soul = HermesSoulRegistry.getSoul(testTenant);
    expect(soul).toBeDefined();
    expect(soul.projectSlug).toBe(testTenant);
    expect(soul.agentName).toContain('Tulum Palms');
    expect(soul.canonicalUrls.dataRoom).toBe('https://dataroom.pandoras.finance/tulum-palms');
    expect(soul.claimsPolicy.prohibited).toContain('rendimiento fijo garantizado');
  });

  it('PROV-RE-004: S\'Narai Canonical Configuration preserves backward compatibility as Reference Tenant', () => {
    const snaraiConfig = RealEstateProvisioner.getSnaraiCanonicalConfiguration();
    expect(snaraiConfig.tenantSlug).toBe('snarai');
    expect(snaraiConfig.experienceTemplate).toBe('LUXURY');
    expect(snaraiConfig.tokenPriceUsd).toBe(50);
    expect(snaraiConfig.knowledge.developerCompany).toBe('Aztecas Hub S.A.P.I. de C.V.');
    expect(snaraiConfig.knowledge.propertyTypesOffered).toContain('FRACTIONAL');
  });
});
