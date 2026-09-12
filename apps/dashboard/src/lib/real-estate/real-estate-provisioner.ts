/**
 * Hermes Real Estate Provisioner Service
 * src/lib/real-estate/real-estate-provisioner.ts
 *
 * Implements Phase 5: Tenant Provisioning Integration for Real Estate.
 * Provides zero-code onboarding for real estate developments by:
 * 1. Building the Real Estate Domain Pack from configuration.
 * 2. Compiling deterministic FACT claims and Safe Harbor legal doctrines.
 * 3. Provisioning sovereign tenant intelligence via TenantProvisioner.
 * 4. Registering the experience template (LUXURY, LAND, YIELD) and portal modules.
 * 5. Ensuring seamless backward compatibility with S'Narai as the reference tenant.
 */

import { db } from '@/db';
import { projects, hermesClaimContracts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { 
  createRealEstateDomainPack, 
  RealEstateTenantConfig, 
  ClientProjectKnowledge,
  RealEstateUnitDefinition,
  RealEstateDoctrineEngine,
  RealEstateObjectionCategory
} from '@/lib/hermes/packs/real-estate-pack';
import { 
  REAL_ESTATE_EXPERIENCE_TEMPLATES, 
  RealEstateExperienceTemplateKey, 
  RealEstateExperienceTemplateDefinition 
} from './experience-templates';
import { TenantProvisioner } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-provisioner';
import { 
  TenantIntelligenceProvisionInput, 
  TenantClaimInput, 
  TenantProvisionResult 
} from '@/lib/pandoras/core/domains/hermes/tenants/contracts';
import { HermesIdentitySigner } from '@/lib/pandoras/core/domains/hermes/identity/identity-signer';
import { SNARAI_SOUL, HermesSoulRegistry } from '@/lib/hermes/soul/snarai-soul';

export interface ProvisionRealEstateTenantInput {
  tenantSlug: string;
  developmentName: string;
  experienceTemplate: RealEstateExperienceTemplateKey;
  knowledge: ClientProjectKnowledge;
  inventory?: RealEstateUnitDefinition[];
  tokenPriceUsd?: number;
  totalSupply?: number;
  dataRoomUrl?: string;
  applicantWalletAddress?: string;
  customAgentName?: string;
  customPersona?: string;
}

export interface RealEstateProvisionResult {
  success: boolean;
  tenantSlug: string;
  developmentName: string;
  experienceTemplate: RealEstateExperienceTemplateKey;
  templateDefinition: RealEstateExperienceTemplateDefinition;
  domainPackId: string;
  claimsCount: number;
  claimContractCid: string;
  status: string;
}

export class RealEstateProvisioner {
  /**
   * Provisions a new Real Estate development into Hermes Growth OS
   * without code modification or recompilation (Declarative Rollout).
   */
  public static async provisionRealEstateDevelopment(
    input: ProvisionRealEstateTenantInput,
    options?: {
      overrideSigner?: HermesIdentitySigner;
      skipDb?: boolean;
    }
  ): Promise<RealEstateProvisionResult> {
    const cleanSlug = input.tenantSlug.toLowerCase().trim();
    const templateDef = REAL_ESTATE_EXPERIENCE_TEMPLATES[input.experienceTemplate] || REAL_ESTATE_EXPERIENCE_TEMPLATES.LUXURY;

    // 1. Create Domain Pack Manifest via factory
    const defaultAgentName = `Hermes · ${input.developmentName}`;
    const tenantConfig: RealEstateTenantConfig = {
      tenantId: cleanSlug,
      developmentName: input.developmentName,
      knowledge: input.knowledge,
      inventory: input.inventory,
      customAgentName: input.customAgentName || defaultAgentName,
      customPersona: input.customPersona || templateDef.description,
    };
    const domainPack = createRealEstateDomainPack(tenantConfig);

    // 2. Extract approved doctrines and map to Governed Claims
    const customClaims: TenantClaimInput[] = [];
    const objectionCategories: RealEstateObjectionCategory[] = [
      'LEGAL_CERTAINTY',
      'CAPITAL_APPRECIATION',
      'DELIVERY_TIMELINE',
      'EXIT_LIQUIDITY',
      'MAINTENANCE_HOA',
    ];

    for (const cat of objectionCategories) {
      const resolved = RealEstateDoctrineEngine.resolveObjection(cat, input.knowledge);
      customClaims.push({
        claimId: `claim_doctrine_${cat.toLowerCase()}`,
        category: cat === 'LEGAL_CERTAINTY' ? 'FACT' : (cat === 'CAPITAL_APPRECIATION' ? 'PROJECTION' : 'PRODUCT_BOUNDARY'),
        canonicalAssertion: resolved.responseStrategy,
        permittedPhrasings: [
          cat.toLowerCase().replace(/_/g, ' '),
          input.knowledge.developmentName,
        ],
        disclosureClearance: 'PUBLIC',
      });
    }

    // Add Safe Harbor Financial Disclaimer as a foundational governed claim
    customClaims.push({
      claimId: 'claim_safe_harbor_disclaimer',
      category: 'FACT',
      canonicalAssertion: RealEstateDoctrineEngine.SAFE_HARBOR_FINANCIAL_DISCLAIMER,
      permittedPhrasings: ['aviso de transparencia', 'no constituye rendimiento garantizado'],
      disclosureClearance: 'PUBLIC',
    });

    // 3. Assemble Tenant Intelligence Provisioning Input
    const provisionInput: TenantIntelligenceProvisionInput = {
      tenantId: cleanSlug,
      organizationName: input.developmentName,
      agentName: input.customAgentName || domainPack.soul.agentName,
      projectMetadata: {
        tokenPriceUsd: input.tokenPriceUsd,
        totalSupply: input.totalSupply,
        location: input.knowledge.location,
        legalEntity: input.knowledge.developerCompany,
        websiteUrl: input.dataRoomUrl || `https://dash.pandoras.finance/portal/${cleanSlug}`,
      },
      customClaims,
      forbiddenTerms: [
        'rendimiento financiero garantizado',
        'ganancia asegurada',
        'inversión 100% libre de riesgo',
        'retorno fijo mensual garantizado',
      ],
      preferredReplacements: {
        'ganancia asegurada': 'proyección estimada según Data Room',
        'retorno garantizado': 'retorno proyectado según modelo financiero',
        'sin riesgo': 'sujeto a condiciones de mercado y avances de obra',
      },
    };

    // 4. Provision intelligence and anchor Claim Contract
    const provResult: TenantProvisionResult = await TenantProvisioner.provisionTenantIntelligence(
      provisionInput,
      {
        overrideSigner: options?.overrideSigner,
        skipDb: options?.skipDb,
      }
    );

    // 5. Register in HermesSoulRegistry so all runtime channels immediately resolve the new tenant
    HermesSoulRegistry.registerTenantSoul(cleanSlug, {
      projectSlug: cleanSlug,
      agentName: input.customAgentName || domainPack.soul.agentName,
      persona: input.customPersona || domainPack.soul.persona,
      voice: 'Ejecutivo, transparente, analítico y patrimonial.',
      tone: {
        dos: [
          `Sé directo, transparente y analítico al responder sobre ${input.developmentName}.`,
          'Fundamenta cada respuesta técnica o jurídica en los documentos oficiales del Data Room.',
          'Incluye siempre los avisos de transparencia en menciones de plusvalía o estimaciones.',
          'Si el prospecto tiene interés de compra, condúcelo a agendar una sesión ejecutiva.',
        ],
        donts: [
          'NO prometas retornos fijos, rendimientos garantizados ni plusvalía asegurada.',
          'NO afirmes permisos, licencias o avances que no consten en el Data Room.',
        ],
      },
      languagePolicy: {
        avoidAsDefault: [
          'blockchain', 'tokenización', 'cripto', 'Web3', 'smart contract',
          'rendimiento garantizado', 'ganancia asegurada',
        ],
        preferred: {
          'tokenización': 'inversión fraccional o copropiedad certificada',
          'ganancia asegurada': 'proyección patrimonial',
        },
        allowedWhenAsked: ['blockchain', 'registro digital', 'contrato inteligente'],
      },
      claimsPolicy: {
        prohibited: [
          'rendimiento fijo garantizado',
          'retorno asegurado sin riesgo',
        ],
        requiredQualification: [
          'plusvalía estimada',
          'rendimientos por pool de rentas',
        ],
      },
      escalationPolicy: {
        legalQuestions: 'ESCALATE',
        taxQuestions: 'ESCALATE',
        customInvestmentAdvice: 'ESCALATE',
        unavailableProjectData: 'ESCALATE',
        founderRequest: 'HANDOFF',
        outOfScopeQuestion: 'ANSWER',
      },
      fallbackResponse: `Esa consulta requiere revisión con los expedientes oficiales de ${input.developmentName}. Te comunicaré con un asesor oficial del desarrollo.`,
      canonicalUrls: {
        dataRoom: input.dataRoomUrl || `https://dash.pandoras.finance/portal/${cleanSlug}/data-room`,
        calendar: `https://dash.pandoras.finance/events/${cleanSlug}/1`,
      },
      closingSignature: `— Equipo ${input.developmentName}`,
    });

    // 6. DB persistence of Project configuration (when not skipDb)
    if (!options?.skipDb && db) {
      try {
        await db
          .update(projects)
          .set({
            extraConfig: {
              vertical: 'REAL_ESTATE',
              experienceTemplate: input.experienceTemplate,
              templateDefinition: templateDef,
              domainPackId: domainPack.id,
              knowledge: input.knowledge,
              provisionedAt: new Date().toISOString(),
            },
          })
          .where(eq(projects.slug, cleanSlug));
      } catch (dbErr) {
        console.warn(`[RealEstateProvisioner] Non-blocking projects update notice for '${cleanSlug}':`, dbErr);
      }
    }

    return {
      success: true,
      tenantSlug: cleanSlug,
      developmentName: input.developmentName,
      experienceTemplate: input.experienceTemplate,
      templateDefinition: templateDef,
      domainPackId: domainPack.id,
      claimsCount: provResult.claimsCount,
      claimContractCid: provResult.claimContractCid,
      status: provResult.status,
    };
  }

  /**
   * Reference Tenant: Returns the canonical configuration for S'Narai
   * guaranteeing 100% backward compatibility under the LUXURY template.
   */
  public static getSnaraiCanonicalConfiguration(): ProvisionRealEstateTenantInput {
    return {
      tenantSlug: 'snarai',
      developmentName: "S'Narai Riviera Nayarit",
      experienceTemplate: 'LUXURY',
      knowledge: {
        developmentName: "S'Narai Riviera Nayarit",
        location: 'San Pancho, Riviera Nayarit, México',
        legalStructure: 'SPV_CORPORATE_SHARES',
        legalStructureDescription: 'Vehículo de propósito especial y Títulos Digitales de Participación bajo Aztecas Hub S.A.P.I. de C.V.',
        developerCompany: 'Aztecas Hub S.A.P.I. de C.V.',
        propertyTypesOffered: ['FRACTIONAL', 'VILLA', 'CONDOMINIUM'],
        commercialStage: 'FAMILY_AND_FRIENDS',
        estimatedDeliveryDate: '14-18 meses posteriores al cierre de Fase 1',
        estimatedAppreciationPercentage: 'Apreciación estimada entre fases: Fase 1 ($50 USD), Fase 2 ($75 USD), Fase 3 ($100 USD)',
        rentalPoolEnabled: true,
        maintenanceFeeEstimated: 'Calculado sobre gastos reales de administración hotelera',
        approvedDocuments: [
          {
            title: 'Constitutiva Aztecas Hub S.A.P.I. de C.V.',
            category: 'LEGAL',
            documentUrl: 'https://snarai.aztecaz.xyz/institutional/legal',
            isPublicInDataRoom: true,
          },
          {
            title: 'Due Diligence Index',
            category: 'FINANCIAL',
            documentUrl: 'https://snarai.aztecaz.xyz/institutional/due-diligence-index',
            isPublicInDataRoom: true,
          },
        ],
      },
      tokenPriceUsd: 50,
      totalSupply: 10000,
      dataRoomUrl: 'https://snarai.aztecaz.xyz/institutional',
      customAgentName: SNARAI_SOUL.agentName,
      customPersona: SNARAI_SOUL.persona,
    };
  }
}
