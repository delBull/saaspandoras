/**
 * 🏛️ Pandora's Hermes OS — Sovereign Claim Contract & Governed Intelligence Engine (Milestone K26)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/claim-contract-engine.ts
 *
 * Implements Sovereign Claim Governance:
 * 1. Positive Allowed Claims Contract (FACT | HISTORICAL_DATA | PROJECTION | PRODUCT_BOUNDARY).
 * 2. Immutable IPFS Pinning & Agent Wallet EIP-712 Attestation.
 * 3. Epistemic Framing Enforcement (e.g. historical metrics cannot mutate into future guarantees).
 * 4. Claim Provenance Receipt generation for verifiable inference.
 */

import crypto from 'crypto';
import { HermesIdentitySigner } from '../identity/identity-signer';
import { TenantIpfsVaultService } from './ipfs-vault';
import { db } from '@/db';
import { hermesClaimContracts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export type EpistemicCategory = 'FACT' | 'HISTORICAL_DATA' | 'PROJECTION' | 'PRODUCT_BOUNDARY';

export interface ClaimProvenance {
  artifactId: string;
  contentHash: string;
  ipfsCid: string;
  version: number;
}

export interface GovernedClaim {
  claimId: string;
  category: EpistemicCategory;
  canonicalAssertion: string;
  permittedPhrasings: string[];
  mandatoryDisclosures?: string[];
  forbiddenMutations?: RegExp[];
  provenance: ClaimProvenance;
}

export interface TenantClaimContract {
  tenantId: string;
  version: number;
  claims: GovernedClaim[];
  agentWalletAddress?: string;
  contractHash: string;
  ipfsCid?: string;
  ipfsUri?: string;
  agentSignature?: string;
  governanceStatus: 'ACTIVE' | 'SHADOW_VERIFIED' | 'REVOKED';
  updatedAt: string;
}

export interface ClaimProvenanceReceipt {
  receiptId: string;
  tenantId: string;
  matchedClaimIds: string[];
  proofHash: string;
  agentSignature?: string;
  verifiedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CANONICAL S'NARAI CLAIM CONTRACT (SEED)
// ─────────────────────────────────────────────────────────────────────────────

export const SNARAI_CANONICAL_CLAIM_CONTRACT: TenantClaimContract = {
  tenantId: 'snarai',
  version: 1,
  governanceStatus: 'ACTIVE',
  contractHash: 'c7a8b9f1d2e3456789abcdef0123456789abcdef0123456789abcdef01234567',
  ipfsCid: 'bafkreihqwt63k23456789abcdef0123456789abcdef0123456789abcdef01',
  ipfsUri: 'ipfs://bafkreihqwt63k23456789abcdef0123456789abcdef0123456789abcdef01',
  updatedAt: new Date().toISOString(),
  claims: [
    {
      claimId: 'claim_corporate_entity',
      category: 'FACT',
      canonicalAssertion: "S'Narai Riviera Nayarit opera bajo la estructura corporativa de Aztecas Hub S.A.P.I. de C.V.",
      permittedPhrasings: [
        'estructura corporativa de Aztecas Hub S.A.P.I. de C.V.',
        'Aztecas Hub S.A.P.I. de C.V. como vehículo corporativo',
      ],
      provenance: {
        artifactId: 'snarai_corporate_framework',
        contentHash: 'f4d92a1b3c5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
        ipfsCid: 'bafkreib5k3corporateframeworksnarai0123456789abcdef',
        version: 1,
      },
    },
    {
      claimId: 'claim_fractional_units',
      category: 'FACT',
      canonicalAssertion: "Inversión fraccionada en el desarrollo mediante Títulos de Participación desde $50 USD.",
      permittedPhrasings: [
        'Títulos de Participación desde $50 USD',
        'inversión fraccionada accesible desde $50 USD',
      ],
      provenance: {
        artifactId: 'snarai_products_units',
        contentHash: '8b4f1c3d5e7a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
        ipfsCid: 'bafkreibproductsunitssnarai0123456789abcdef',
        version: 1,
      },
    },
    {
      claimId: 'claim_historical_plusvalia',
      category: 'HISTORICAL_DATA',
      canonicalAssertion: "Plusvalía histórica en la zona de Riviera Nayarit del 12% al 15% anual basada en datos de mercado pasados.",
      permittedPhrasings: [
        'plusvalía histórica del 12% al 15% anual en la zona',
        'comportamiento histórico de plusvalía del 12-15%',
      ],
      mandatoryDisclosures: [
        'Los rendimientos y plusvalías pasadas no garantizan rendimientos futuros.',
      ],
      forbiddenMutations: [
        /\b(?:obtendr[aá]s|recibir[aá]s|garantizamos|rendimiento seguro|tasa garantizada|retorno garantizado|ganancia asegurada)(?:[^.!?\n]{0,40})?(?:12|15|12-15)%/i,
      ],
      provenance: {
        artifactId: 'snarai_market_historical_metrics',
        contentHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        ipfsCid: 'bafkreibhistoricalmetricssnarai0123456789abcdef',
        version: 1,
      },
    },
    {
      claimId: 'claim_vacation_rental_prorata',
      category: 'FACT',
      canonicalAssertion: "Participación en el rendimiento operativo pro-rata generado por rentas vacacionales del complejo.",
      permittedPhrasings: [
        'rendimiento operativo pro-rata de rentas vacacionales',
        'distribución proporcional de ingresos por rentas vacacionales',
      ],
      provenance: {
        artifactId: 'snarai_revenue_model',
        contentHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        ipfsCid: 'bafkreibrevenuemodelsnarai0123456789abcdef',
        version: 1,
      },
    },
    {
      claimId: 'claim_residential_boutique',
      category: 'PRODUCT_BOUNDARY',
      canonicalAssertion: "S'Narai es un desarrollo residencial boutique en Bucerías, Riviera Nayarit (no es un condo-hotel ni tiempo compartido).",
      permittedPhrasings: [
        'complejo residencial boutique en Bucerías',
        'desarrollo residencial en Bucerías, Riviera Nayarit',
      ],
      provenance: {
        artifactId: 'snarai_property_scope',
        contentHash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
        ipfsCid: 'bafkreibpropertyscopesnarai0123456789abcdef',
        version: 1,
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SOVEREIGN CLAIM CONTRACT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class ClaimContractEngine {
  private static registeredContracts: Map<string, TenantClaimContract> = new Map([
    ['snarai', SNARAI_CANONICAL_CLAIM_CONTRACT],
    ['org_snarai', SNARAI_CANONICAL_CLAIM_CONTRACT],
  ]);

  /**
   * Registers a claim contract in memory/runtime
   */
  public static registerContract(contract: TenantClaimContract): void {
    const key = contract.tenantId.toLowerCase().replace(/^org_/, '');
    this.registeredContracts.set(key, contract);
    this.registeredContracts.set(`org_${key}`, contract);
  }

  /**
   * Retrieves active claim contract for a tenant from memory
   */
  public static getContract(tenantId: string): TenantClaimContract | undefined {
    const key = tenantId.toLowerCase().replace(/^org_/, '');
    return this.registeredContracts.get(key);
  }

  /**
   * Asynchronously retrieves or loads active claim contract from DB if not in memory cache
   */
  public static async getOrLoadContract(tenantId: string): Promise<TenantClaimContract | undefined> {
    const key = tenantId.toLowerCase().replace(/^org_/, '');
    const cached = this.registeredContracts.get(key);
    if (cached) return cached;

    if (db) {
      try {
        const rows = await db
          .select()
          .from(hermesClaimContracts)
          .where(eq(hermesClaimContracts.tenantId, key))
          .orderBy(desc(hermesClaimContracts.version))
          .limit(1);

        if (rows.length > 0 && rows[0]?.governanceStatus === 'ACTIVE') {
          const row = rows[0];
          const loaded: TenantClaimContract = {
            tenantId: row.tenantId,
            version: row.version,
            contractHash: row.contractHash,
            ipfsCid: row.ipfsCid,
            ipfsUri: row.ipfsUri,
            claims: (row.claims as unknown as GovernedClaim[]) || [],
            agentWalletAddress: row.signedByAddress,
            agentSignature: row.agentSignature,
            governanceStatus: row.governanceStatus as 'ACTIVE',
            updatedAt: row.updatedAt.toISOString(),
          };
          this.registerContract(loaded);
          return loaded;
        }
      } catch (err: any) {
        console.warn('[ClaimContractEngine] DB query warning:', err?.message);
      }
    }
    return undefined;
  }

  /**
   * Anchors and cryptographically signs a claim contract to IPFS with Hermes Agent Wallet
   */
  public static async anchorClaimContractToIpfs(
    contract: TenantClaimContract,
    agentSigner: HermesIdentitySigner,
    vaultService?: TenantIpfsVaultService
  ): Promise<TenantClaimContract> {
    const cleanTenant = contract.tenantId.toLowerCase().replace(/^org_/, '');
    const canonicalPayload = JSON.stringify({
      tenantId: cleanTenant,
      version: contract.version,
      claims: contract.claims,
    });

    const contractHash = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');

    // 1. Pin to IPFS via TenantIpfsVaultService (real Pinata in prod / deterministic in test)
    const vault = vaultService || new TenantIpfsVaultService();
    const payloadObj = {
      tenantId: cleanTenant,
      version: contract.version,
      claims: contract.claims,
      contractHash,
    };
    const ipfsCid = await vault.pinJsonToIpfs(payloadObj, `claim_contract_${cleanTenant}_v${contract.version}`);

    // 2. Sign with Agent Wallet (EIP-712 Intent)
    const signedIntent = await agentSigner.signIntent({
      tenantId: cleanTenant,
      actorId: `agent_wallet_${cleanTenant}`,
      actionName: 'knowledge.claim_contract_anchor',
      resourceId: ipfsCid,
      policyHash: contractHash,
    });

    const anchoredContract: TenantClaimContract = {
      ...contract,
      tenantId: cleanTenant,
      contractHash,
      ipfsCid,
      ipfsUri: `ipfs://${ipfsCid}`,
      agentWalletAddress: agentSigner.getPublicAddress(),
      agentSignature: signedIntent.signature,
      governanceStatus: 'ACTIVE',
      claims: contract.claims,
      updatedAt: new Date().toISOString(),
    };

    this.registerContract(anchoredContract);

    // 3. Persist local index to Neon PostgreSQL
    if (db) {
      try {
        await db.insert(hermesClaimContracts).values({
          id: `cc_${cleanTenant}_v${contract.version}_${Date.now()}`,
          tenantId: cleanTenant,
          version: contract.version,
          contractHash,
          ipfsCid,
          ipfsUri: `ipfs://${ipfsCid}`,
          claims: contract.claims as any,
          signedByAddress: agentSigner.getPublicAddress(),
          agentSignature: signedIntent.signature,
          governanceStatus: 'ACTIVE',
        }).onConflictDoUpdate({
          target: [hermesClaimContracts.tenantId, hermesClaimContracts.version],
          set: {
            contractHash,
            ipfsCid,
            ipfsUri: `ipfs://${ipfsCid}`,
            claims: contract.claims as any,
            signedByAddress: agentSigner.getPublicAddress(),
            agentSignature: signedIntent.signature,
            governanceStatus: 'ACTIVE',
            updatedAt: new Date(),
          },
        });
      } catch (err: any) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`[ClaimContractEngine] DB persistence failed in production: ${err?.message}`);
        }
        console.warn('[ClaimContractEngine] DB persistence warning (dev/test):', err?.message);
      }
    }

    return anchoredContract;
  }

  /**
   * Validates that LLM output does not violate Epistemic Framing rules (e.g. HISTORICAL_DATA -> GUARANTEE)
   */
  public static validateEpistemicFraming(
    text: string,
    tenantId: string
  ): { valid: boolean; violations: Array<{ code: string; message: string }> } {
    const contract = this.getContract(tenantId);
    if (!contract || contract.governanceStatus !== 'ACTIVE') {
      return { valid: true, violations: [] };
    }

    const violations: Array<{ code: string; message: string }> = [];

    for (const claim of contract.claims) {
      if (claim.category === 'HISTORICAL_DATA' && claim.forbiddenMutations) {
        for (const mutPattern of claim.forbiddenMutations) {
          let reg: RegExp | null = null;
          if (mutPattern instanceof RegExp) {
            reg = mutPattern;
          } else if (typeof mutPattern === 'string') {
            reg = new RegExp(mutPattern, 'i');
          } else if (mutPattern && typeof (mutPattern as any).source === 'string') {
            reg = new RegExp((mutPattern as any).source, (mutPattern as any).flags || 'i');
          }

          if (reg && reg.test(text)) {
            violations.push({
              code: 'EPISTEMIC_MUTATION_TO_GUARANTEE',
              message: `El dato histórico (${claim.claimId}) fue presentado indebidamente como una promesa o expectativa futura garantizada.`,
            });
          }
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Generates a verifiable Claim Provenance Receipt for customer outputs.
   * AgentSigner is mandatory to guarantee EIP-712 cryptographic attestation.
   */
  public static async generateClaimProvenanceReceipt(
    text: string,
    tenantId: string,
    agentSigner: HermesIdentitySigner
  ): Promise<ClaimProvenanceReceipt | null> {
    if (!agentSigner) {
      throw new Error('[ClaimContractEngine] HermesIdentitySigner is mandatory to generate signed claim receipts.');
    }

    const contract = this.getContract(tenantId);
    if (!contract || contract.governanceStatus !== 'ACTIVE') {
      return null;
    }

    const matchedClaimIds: string[] = [];
    for (const claim of contract.claims) {
      const keywords = claim.canonicalAssertion
        .split(/\s+/)
        .map(w => w.replace(/[^\wáéíóúÁÉÍÓÚñÑ]/g, ''))
        .filter(w => w.length > 4);

      const matchCount = keywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(text)).length;
      if (matchCount >= 2 || claim.permittedPhrasings.some(p => text.toLowerCase().includes(p.toLowerCase()))) {
        matchedClaimIds.push(claim.claimId);
      }
    }

    if (matchedClaimIds.length === 0) {
      return null;
    }

    const payload = `${tenantId}:${matchedClaimIds.sort().join(',')}:${contract.contractHash}`;
    const proofHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');

    const signed = await agentSigner.signIntent({
      tenantId,
      actorId: `agent_wallet_${tenantId}`,
      actionName: 'hermes.claim_provenance_attestation',
      resourceId: matchedClaimIds.join(':'),
      policyHash: proofHash,
    });

    return {
      receiptId: `rec_${Date.now()}_${proofHash.substring(0, 8)}`,
      tenantId,
      matchedClaimIds,
      proofHash,
      agentSignature: signed.signature,
      verifiedAt: new Date().toISOString(),
    };
  }
}
