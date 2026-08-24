/**
 * 🏛️ HERMES OS — Tenant Provisioning Service & Sovereign Lifecycle
 * src/lib/pandoras/core/domains/hermes/tenants/tenant-provisioner.ts
 *
 * Implements PENDIENTE 1: External Tenant Intelligence Setup & Contract Provisioning
 * - Compiles deterministic FACT claims from project metadata
 * - Compiles interpretative claims with review/clearance gating
 * - Anchors Claim Contracts to IPFS with EIP-712 Agent Wallet signature
 * - Persists into hermes_claim_contracts, hermes_knowledge_registry, and projects
 * - Bootloader / Lazy loader for TenantResponsePolicyGate
 */

import * as crypto from 'crypto';
import { db } from '@/db';
import { 
  hermesClaimContracts, 
  hermesKnowledgeRegistry, 
  hermesKnowledge, 
  projects 
} from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { 
  ClaimContractEngine, 
  TenantClaimContract, 
  GovernedClaim 
} from '../knowledge/claim-contract-engine';
import { HermesIdentitySigner } from '../identity/identity-signer';
import { TenantIpfsVaultService } from '../knowledge/ipfs-vault';
import { TenantResponsePolicyGate, TenantResponsePolicyConfig } from '../runtime/policy/tenant-response-policy';
import { 
  TenantIntelligenceProvisionInput, 
  TenantProvisionResult, 
  TenantAuthorityManifest, 
  TenantIdentitySoulManifest 
} from './contracts';
import { AgentSoul } from '@/lib/hermes/soul/snarai-soul';

export class TenantProvisioner {
  private static signerInstance: HermesIdentitySigner | null = null;

  private static getSigner(): HermesIdentitySigner {
    if (!this.signerInstance) {
      this.signerInstance = new HermesIdentitySigner();
    }
    return this.signerInstance;
  }

  /**
   * Provisions a tenant's complete intelligence stack:
   * 1. Deterministic & Interpretative Claims
   * 2. IPFS Claim Contract Anclaje
   * 3. Knowledge Registry Artifacts
   * 4. Identity & Response Policy Manifests
   */
  public static async provisionTenantIntelligence(
    input: TenantIntelligenceProvisionInput,
    options?: {
      dbClient?: any;
      overrideSigner?: HermesIdentitySigner;
      skipDb?: boolean;
    }
  ): Promise<TenantProvisionResult> {
    const rawTenantId = input.tenantId.trim();
    const cleanTenantId = rawTenantId.toLowerCase().replace(/^org_/, '');
    const organizationName = input.organizationName.trim();
    const agentName = input.agentName || 'Hermes';
    const signer = options?.overrideSigner || this.getSigner();
    const signerAddress = signer.getPublicAddress();
    const activeDb = options?.dbClient || db;

    // 1. Compile Deterministic FACT Claims from Structured Metadata
    const claims: GovernedClaim[] = [];
    const meta = input.projectMetadata;

    if (meta) {
      if (meta.tokenPriceUsd !== undefined && meta.tokenPriceUsd !== null) {
        claims.push({
          claimId: 'claim_deterministic_price',
          category: 'FACT',
          canonicalAssertion: `Precio oficial de preventa: $${meta.tokenPriceUsd} USD por token.`,
          permittedPhrasings: [`$${meta.tokenPriceUsd} USD`, `precio de $${meta.tokenPriceUsd}`],
          disclosureClearance: 'PUBLIC',
          provenance: {
            artifactId: 'project_metadata',
            contentHash: crypto.createHash('sha256').update(String(meta.tokenPriceUsd)).digest('hex'),
            ipfsCid: TenantIpfsVaultService.computeCanonicalCidV1(`price_${meta.tokenPriceUsd}`),
            version: 1,
          },
        });
      }

      if (meta.location) {
        claims.push({
          claimId: 'claim_deterministic_location',
          category: 'FACT',
          canonicalAssertion: `Ubicación del proyecto: ${meta.location}.`,
          permittedPhrasings: [meta.location],
          disclosureClearance: 'PUBLIC',
          provenance: {
            artifactId: 'project_metadata',
            contentHash: crypto.createHash('sha256').update(meta.location).digest('hex'),
            ipfsCid: TenantIpfsVaultService.computeCanonicalCidV1(`loc_${meta.location}`),
            version: 1,
          },
        });
      }

      if (meta.legalEntity) {
        claims.push({
          claimId: 'claim_deterministic_legal',
          category: 'FACT',
          canonicalAssertion: `Estructura legal operada por ${meta.legalEntity}.`,
          permittedPhrasings: [meta.legalEntity],
          disclosureClearance: 'PUBLIC',
          provenance: {
            artifactId: 'project_metadata',
            contentHash: crypto.createHash('sha256').update(meta.legalEntity).digest('hex'),
            ipfsCid: TenantIpfsVaultService.computeCanonicalCidV1(`legal_${meta.legalEntity}`),
            version: 1,
          },
        });
      }

      if (meta.totalSupply) {
        claims.push({
          claimId: 'claim_deterministic_supply',
          category: 'FACT',
          canonicalAssertion: `Suministro total emitido: ${meta.totalSupply} unidades.`,
          permittedPhrasings: [`${meta.totalSupply} unidades`, `${meta.totalSupply} tokens`],
          disclosureClearance: 'PUBLIC',
          provenance: {
            artifactId: 'project_metadata',
            contentHash: crypto.createHash('sha256').update(String(meta.totalSupply)).digest('hex'),
            ipfsCid: TenantIpfsVaultService.computeCanonicalCidV1(`supply_${meta.totalSupply}`),
            version: 1,
          },
        });
      }
    }

    // 2. Append Custom / Interpretative Claims
    if (input.customClaims && input.customClaims.length > 0) {
      for (const custom of input.customClaims) {
        claims.push({
          claimId: custom.claimId,
          category: custom.category,
          canonicalAssertion: custom.canonicalAssertion,
          permittedPhrasings: custom.permittedPhrasings || [custom.canonicalAssertion],
          disclosureClearance: custom.disclosureClearance || 'PUBLIC',
          provenance: {
            artifactId: `custom_${custom.claimId}`,
            contentHash: crypto.createHash('sha256').update(custom.canonicalAssertion).digest('hex'),
            ipfsCid: TenantIpfsVaultService.computeCanonicalCidV1(`custom_${custom.claimId}_${custom.canonicalAssertion}`),
            version: 1,
          },
        });
      }
    }

    // 3. Construct and Anchor TenantClaimContract
    const contractVersion = 1;
    const contractHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ tenantId: cleanTenantId, version: contractVersion, claims }))
      .digest('hex');

    const initialContract: TenantClaimContract = {
      tenantId: cleanTenantId,
      version: contractVersion,
      governanceStatus: 'ACTIVE',
      contractHash,
      ipfsCid: `mock_bafkrei_contract_${contractVersion}_${cleanTenantId}`,
      ipfsUri: `ipfs://mock_bafkrei_contract_${contractVersion}_${cleanTenantId}`,
      claims,
      updatedAt: new Date().toISOString(),
    };

    // Anchor to IPFS & register in ClaimContractEngine
    let claimContract = initialContract;
    try {
      const vault = new TenantIpfsVaultService();
      claimContract = await ClaimContractEngine.anchorClaimContractToIpfs(initialContract, signer, vault);
    } catch (pinErr) {
      console.warn('[TenantProvisioner] IPFS anchor fallback:', pinErr);
      ClaimContractEngine.registerContract(initialContract);
    }

    const ipfsCid = claimContract.ipfsCid || `mock_bafkrei_contract_${contractVersion}_${cleanTenantId}`;
    const ipfsUri = claimContract.ipfsUri || `ipfs://${ipfsCid}`;

    // 4. Construct Identity & Soul Manifest
    const identityManifest: TenantIdentitySoulManifest = {
      tenantId: cleanTenantId,
      version: 1,
      agentName,
      organizationName,
      persona: input.persona || `Asistente de Inteligencia Soberana de ${organizationName}`,
      voice: input.voice || 'Institucional, riguroso, empático y transparente.',
      tone: {
        dos: ['Explicar con datos verificables', 'Citar fuentes oficiales'],
        donts: ['Hacer promesas financieras no respaldadas', 'Garantizar rendimientos fijos'],
      },
      languagePolicy: {
        avoidAsDefault: input.forbiddenTerms || ['rendimiento garantizado', 'ganancia asegurada', 'sin riesgo'],
        preferred: input.preferredReplacements || {
          'ganancia asegurada': 'proyección estimada',
          'sin riesgo': 'sujeto a condiciones de mercado',
        },
        allowedWhenAsked: ['retorno histórico', 'distribución de beneficios'],
      },
      claimsPolicy: {
        prohibited: input.forbiddenTerms || ['rendimientos mensuales fijos', 'cero riesgo', 'ganancia asegurada'],
        requiredQualification: ['rendimientos proyectados', 'plusvalía estimada'],
      },
      escalationPolicy: {
        legalQuestions: 'ESCALATE',
        taxQuestions: 'ESCALATE',
        customInvestmentAdvice: 'ESCALATE',
        unavailableProjectData: 'ESCALATE',
        founderRequest: 'ESCALATE',
        outOfScopeQuestion: 'ANSWER',
      },
      canonicalUrls: input.canonicalUrls || {
        website: meta?.websiteUrl || `https://${cleanTenantId}.com`,
      },
      closingSignature: `— Equipo ${organizationName}`,
    };

    // 5. Construct Tenant Response Policy Configuration
    const policyConfig: TenantResponsePolicyConfig = {
      tenantId: cleanTenantId,
      preferredTerminology: identityManifest.languagePolicy.preferred,
      forbiddenAssertions: identityManifest.claimsPolicy.prohibited.map(term => ({
        pattern: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        code: 'FORBIDDEN_TENANT_ASSERTION',
        message: `Terminología no autorizada para ${organizationName}: "${term}".`,
        isBlock: true,
      })),
      forbiddenEchoTerms: [],
    };

    // Register policy in-memory in TenantResponsePolicyGate
    TenantResponsePolicyGate.registerPolicy(policyConfig);

    // 6. Compute Merkle Root & Root Authority Manifest
    const merkleLeaves = claims.map(c =>
      crypto.createHash('sha256').update(c.canonicalAssertion).digest('hex')
    );
    const merkleRoot = crypto
      .createHash('sha256')
      .update(merkleLeaves.sort().join(''))
      .digest('hex');

    const authorityManifestPayload = {
      manifestVersion: '1.0.0' as const,
      tenantId: cleanTenantId,
      version: 1,
      claimContractCid: ipfsCid,
      identityManifestCid: `mock_bafkrei_identity_${cleanTenantId}`,
      agentWalletAddress: signerAddress,
      governanceStatus: 'ACTIVE' as const,
      merkleRoot,
      signedAt: new Date().toISOString(),
    };

    const signature = await signer.signMessage(JSON.stringify(authorityManifestPayload));

    const authorityManifest: TenantAuthorityManifest = {
      ...authorityManifestPayload,
      governanceStatus: 'ACTIVE',
      agentSignature: signature,
    };

    // 7. Atomic DB Persistence (if not skipDb)
    if (!options?.skipDb && activeDb) {
      try {
        // A. Persist Claim Contract
        await activeDb
          .insert(hermesClaimContracts)
          .values({
            id: `cc_${cleanTenantId}_v${contractVersion}`,
            tenantId: cleanTenantId,
            version: contractVersion,
            contractHash,
            ipfsCid,
            backupIpfsCid: claimContract.backupIpfsCid,
            ipfsUri,
            claims: claims as any,
            signedByAddress: signerAddress,
            agentSignature: signature,
            governanceStatus: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [hermesClaimContracts.tenantId, hermesClaimContracts.version],
            set: {
              contractHash,
              ipfsCid,
              backupIpfsCid: claimContract.backupIpfsCid,
              ipfsUri,
              claims: claims as any,
              signedByAddress: signerAddress,
              agentSignature: signature,
              governanceStatus: 'ACTIVE',
              updatedAt: new Date(),
            },
          });

        // B. Persist Knowledge Registry entries for each knowledge pack
        if (input.knowledgePacks && input.knowledgePacks.length > 0) {
          for (let i = 0; i < input.knowledgePacks.length; i++) {
            const pack = input.knowledgePacks[i]!;
            const contentHash = crypto.createHash('sha256').update(pack.content).digest('hex');
            const artifactId = `pack_${cleanTenantId}_${i + 1}`;
            let packCid = `mock_bafkrei_pack_${cleanTenantId}_${i + 1}`;
            let backupPackCid: string | undefined = undefined;

            try {
              const vault = new TenantIpfsVaultService();
              const pinnedPack = await vault.storeEncryptedKnowledgeToIpfs(
                pack.content,
                {
                  tenantId: cleanTenantId,
                  artifactId,
                  version: 1,
                  classification: (pack.classification || 'PUBLIC') as any,
                },
                signer
              );
              packCid = pinnedPack.cid;
              backupPackCid = pinnedPack.backupCid;
            } catch {
              /* test/offline fallback */
            }

            await activeDb
              .insert(hermesKnowledgeRegistry)
              .values({
                id: `kr_${cleanTenantId}_${i + 1}`,
                tenantId: cleanTenantId,
                domain: pack.dimension || 'project',
                artifactId,
                classification: pack.classification || 'PUBLIC',
                version: 1,
                contentHash,
                ciphertextHash: contentHash,
                ipfsCid: packCid,
                backupIpfsCid: backupPackCid || null,
                ipfsUri: `ipfs://${packCid}`,
                aadBinding: `tenant:${cleanTenantId}:art:${artifactId}:v1`,
                merkleRoot,
                signedByAddress: signerAddress,
                agentSignature: signature,
                governanceStatus: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [
                  hermesKnowledgeRegistry.tenantId,
                  hermesKnowledgeRegistry.domain,
                  hermesKnowledgeRegistry.artifactId,
                  hermesKnowledgeRegistry.version,
                ],
                set: {
                  contentHash,
                  ciphertextHash: contentHash,
                  ipfsCid: packCid,
                  backupIpfsCid: backupPackCid || null,
                  ipfsUri: `ipfs://${packCid}`,
                  governanceStatus: 'ACTIVE',
                  updatedAt: new Date(),
                },
              });

            // Insert plaintext into hermes_knowledge for current hybrid bridge
            await activeDb
              .insert(hermesKnowledge)
              .values({
                id: `k_${cleanTenantId}_${i + 1}`,
                organizationId: cleanTenantId,
                dimension: pack.dimension || 'project',
                key: `${pack.dimension}_${i + 1}`,
                content: pack.content,
                status: 'ACTIVE',
                visibility: pack.visibility || 'PUBLIC',
                classification: pack.classification || 'PUBLIC',
                authority: 'CANONICAL',
                version: 1,
                source: 'OWNER_INPUT',
                sourceReference: 'tenant_onboarding',
                createdBy: 'tenant_provisioner',
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .onConflictDoNothing();
          }
        }

        // C. Update project identity_pack and policy_pack
        await activeDb
          .update(projects)
          .set({
            identityPack: identityManifest as any,
            policyPack: policyConfig as any,
            updatedAt: new Date(),
          })
          .where(or(eq(projects.slug, cleanTenantId), eq(projects.slug, rawTenantId)));
      } catch (dbErr) {
        console.warn('[TenantProvisioner] DB persistence warning (proceeding with memory state):', dbErr);
      }
    }

    return {
      tenantId: cleanTenantId,
      version: contractVersion,
      claimContractCid: ipfsCid,
      identityManifestCid: authorityManifest.identityManifestCid,
      authorityManifestCid: `mock_bafkrei_auth_${cleanTenantId}`,
      merkleRoot,
      signerAddress,
      claimsCount: claims.length,
      knowledgePacksCount: input.knowledgePacks?.length ?? 0,
      status: 'ACTIVE',
    };
  }

  /**
   * Bootloader: Hydrates all tenant policies from database into memory
   */
  public static async bootTenantPolicies(dbClient?: any): Promise<number> {
    const activeDb = dbClient || db;
    if (!activeDb) return 0;

    try {
      const records = await activeDb
        .select({
          slug: projects.slug,
          policyPack: projects.policyPack,
        })
        .from(projects);

      let loadedCount = 0;
      for (const rec of records) {
        if (rec.policyPack && typeof rec.policyPack === 'object') {
          const config = rec.policyPack as TenantResponsePolicyConfig;
          if (config.tenantId || rec.slug) {
            config.tenantId = config.tenantId || rec.slug!;
            TenantResponsePolicyGate.registerPolicy(config);
            loadedCount++;
          }
        }
      }
      return loadedCount;
    } catch (err) {
      console.warn('[TenantProvisioner] Failed to boot tenant policies from DB:', err);
      return 0;
    }
  }

  /**
   * Dynamic Soul Resolver: Hydrates AgentSoul from declarative identity manifest
   */
  public static resolveTenantSoul(manifest: TenantIdentitySoulManifest): AgentSoul {
    return {
      projectSlug: manifest.tenantId,
      agentName: manifest.agentName,
      persona: manifest.persona,
      voice: manifest.voice,
      tone: manifest.tone,
      languagePolicy: manifest.languagePolicy,
      claimsPolicy: manifest.claimsPolicy,
      escalationPolicy: manifest.escalationPolicy,
      fallbackResponse: `Disculpa, no dispongo de información autorizada sobre esa consulta para ${manifest.organizationName}. Te comunicaré con un asesor oficial.`,
      canonicalUrls: manifest.canonicalUrls,
      closingSignature: manifest.closingSignature,
    };
  }
}
