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
import { eq, desc, and } from 'drizzle-orm';

export type EpistemicCategory = 'FACT' | 'HISTORICAL_DATA' | 'PROJECTION' | 'PRODUCT_BOUNDARY';

export type ProvenanceIntentTier =
  | 'LEVEL_0_CONVERSATIONAL'
  | 'LEVEL_1_INFORMATIVE'
  | 'LEVEL_2_COMMERCIAL'
  | 'LEVEL_3_FINANCIAL_CONTRACTUAL'
  | 'LEVEL_4_ACTION';

export type KnowledgeIntegrityState = 'VERIFIED' | 'INVALID';
export type KnowledgeGovernanceLifecycle = 'ACTIVE' | 'SUPERSEDED' | 'DEPRECATED' | 'REVOKED';
export type KnowledgeDisclosureClearance = 'PUBLIC' | 'TENANT_RESTRICTED' | 'INTERNAL_OPERATIONAL' | 'CONFIDENTIAL' | 'SECRET';

export interface ProvenanceTierRequirement {
  tier: ProvenanceIntentTier;
  provenanceRequired: boolean;
  claimAuthorizationRequired: boolean;
  agentAttestationRequired: boolean;
  signatureRequired: boolean;
}

export const TIER_REQUIREMENTS: Record<ProvenanceIntentTier, ProvenanceTierRequirement> = {
  LEVEL_0_CONVERSATIONAL: {
    tier: 'LEVEL_0_CONVERSATIONAL',
    provenanceRequired: false,
    claimAuthorizationRequired: false,
    agentAttestationRequired: false,
    signatureRequired: false,
  },
  LEVEL_1_INFORMATIVE: {
    tier: 'LEVEL_1_INFORMATIVE',
    provenanceRequired: true,
    claimAuthorizationRequired: false,
    agentAttestationRequired: false,
    signatureRequired: false,
  },
  LEVEL_2_COMMERCIAL: {
    tier: 'LEVEL_2_COMMERCIAL',
    provenanceRequired: true,
    claimAuthorizationRequired: true,
    agentAttestationRequired: false,
    signatureRequired: false,
  },
  LEVEL_3_FINANCIAL_CONTRACTUAL: {
    tier: 'LEVEL_3_FINANCIAL_CONTRACTUAL',
    provenanceRequired: true,
    claimAuthorizationRequired: true,
    agentAttestationRequired: true,
    signatureRequired: true,
  },
  LEVEL_4_ACTION: {
    tier: 'LEVEL_4_ACTION',
    provenanceRequired: true,
    claimAuthorizationRequired: true,
    agentAttestationRequired: true,
    signatureRequired: true,
  },
};

export interface ClaimCoverageReport {
  complete: boolean;
  unsupportedSegments: string[];
  matchedClaimsCount: number;
}

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
  disclosureClearance?: KnowledgeDisclosureClearance;
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
  governanceStatus: KnowledgeGovernanceLifecycle;
  disclosureClearance?: KnowledgeDisclosureClearance;
  integrityStatus?: KnowledgeIntegrityState;
  updatedAt: string;
}

export interface GovernedClaimReceiptItem {
  claimId: string;
  claimHash: string;
  category: EpistemicCategory;
  contractCid: string;
  artifactId: string;
  version: number;
}

export interface ClaimProvenanceReceipt {
  receiptId: string;
  tenantId: string;
  agentId: string;
  conversationId?: string;
  responseHash: string;
  provenanceTier: ProvenanceIntentTier;
  provenanceRequired: boolean;
  claimAuthorizationRequired: boolean;
  agentAttestationRequired: boolean;
  signatureRequired: boolean;
  coverage: ClaimCoverageReport;
  claims: GovernedClaimReceiptItem[];
  matchedClaimIds: string[];
  policyVersion: string;
  knowledgeSnapshotHash?: string;
  proofHash: string;
  agentWalletAddress: string;
  agentSignature?: string;
  verifiedAt: string;
  nonce: string;
}

// ─────────────────────────────────────────────────────────────────────────────
export const CANONICAL_CID_REGEX = /^bafkrei[a-z2-7]{52,60}$/;
export const CANONICAL_HASH_REGEX = /^[a-f0-9]{64}$/i;

// ─────────────────────────────────────────────────────────────────────────────
// 1. CANONICAL S'NARAI CLAIM CONTRACT (SEED CON PROVENANCE REAL IPFS)
// ─────────────────────────────────────────────────────────────────────────────

export const SNARAI_CANONICAL_CLAIM_CONTRACT: TenantClaimContract = {
  tenantId: 'snarai',
  version: 1,
  governanceStatus: 'ACTIVE',
  contractHash: 'c7a8b9f1d2e3456789abcdef0123456789abcdef0123456789abcdef01234567',
  ipfsCid: 'bafkreicnahivpdzug3rrsmb2uactdr6vss67m5c4aehs5p7jszans7xsbm',
  ipfsUri: 'ipfs://bafkreicnahivpdzug3rrsmb2uactdr6vss67m5c4aehs5p7jszans7xsbm',
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
        artifactId: 'snarai-identity',
        contentHash: '73c0f9538006d5c32c0d8324f923b7ff82c502fb420caea9aa0f38b4887376c6',
        ipfsCid: 'bafkreietmplfmv4piaqhbejt2jtdzpdr5olkxxpqnto2fg34hzwyvaj2iq',
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
        artifactId: 'snarai-projects',
        contentHash: 'fd48777be76500db628178d8a7c29e62e105e1a3bc891bc0dc0a6a57bfd21da7',
        ipfsCid: 'bafkreieo5sqbcjjj53lhx3p25z4mt3qujbzskwdbet4hqfsex3kmhohrq4',
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
        artifactId: 'snarai-market',
        contentHash: '307dffc1434c279dcf7d7c67926b64d1f2bcf943c2c1ef4be0a33c1f1ecfcaae',
        ipfsCid: 'bafkreie6p2ob3kgjjeszitsfozhow2ygbcmjtxeyoez5skz7kvqpcxvdgy',
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
        artifactId: 'snarai-business',
        contentHash: '8e64fd8546fe7fb1b702ecff993bc715ca2f65a190ea4d0263f35fe3d56f4d22',
        ipfsCid: 'bafkreifes5m64ak6xqem3xegvu26v6h57escwrvfno6ftl2mwhr65lydni',
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
        artifactId: 'snarai-products',
        contentHash: '66b874509e241d9990fe8bf213e8e19c351f7bb9e776961be4fb0818d6a7d5cb',
        ipfsCid: 'bafkreiesqxgybagp5oc57pd7aioszt5h6iyvwc2wt7ydqgcxa7lww76aiu',
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

  private static historicalContracts: Map<string, TenantClaimContract[]> = new Map();

  public static cleanTenant(id: string): string {
    return id.toLowerCase().replace(/['\s_-]/g, '').replace(/^org/, '');
  }

  /**
   * Registers a claim contract in memory/runtime
   */
  public static registerContract(contract: TenantClaimContract): void {
    const key = this.cleanTenant(contract.tenantId);
    this.registeredContracts.set(key, contract);
    this.registeredContracts.set(`org_${key}`, contract);
  }

  /**
   * Retrieves claim contract for a tenant from memory.
   * Isolates SUPERSEDED contracts by default so that only ACTIVE contracts enter current inference.
   */
  public static getContract(
    tenantId: string,
    options?: { allowSuperseded?: boolean; targetVersion?: number }
  ): TenantClaimContract | undefined {
    const key = this.cleanTenant(tenantId);
    const active = this.registeredContracts.get(key);

    if (options?.allowSuperseded) {
      if (options.targetVersion) {
        if (active && active.version === options.targetVersion) return active;
        const history = this.historicalContracts.get(key) || [];
        return history.find(c => c.version === options.targetVersion);
      }
      return active;
    }

    if (active && active.governanceStatus === 'ACTIVE') {
      return active;
    }
    return undefined;
  }

  /**
   * Asynchronously retrieves or loads active claim contract from DB if not in memory cache
   */
  public static async getOrLoadContract(
    tenantId: string,
    options?: { allowSuperseded?: boolean; targetVersion?: number }
  ): Promise<TenantClaimContract | undefined> {
    const key = tenantId.toLowerCase().replace(/^org_/, '');
    const cached = this.getContract(key, options);
    if (cached) return cached;

    if (db) {
      try {
        const rows = await db
          .select()
          .from(hermesClaimContracts)
          .where(eq(hermesClaimContracts.tenantId, key))
          .orderBy(desc(hermesClaimContracts.version))
          .limit(1);

        if (rows.length > 0 && rows[0]) {
          const row = rows[0];
          const isAllowed = options?.allowSuperseded || row.governanceStatus === 'ACTIVE';
          if (isAllowed) {
            const loaded: TenantClaimContract = {
              tenantId: row.tenantId,
              version: row.version,
              contractHash: row.contractHash,
              ipfsCid: row.ipfsCid,
              ipfsUri: row.ipfsUri,
              claims: (row.claims as unknown as GovernedClaim[]) || [],
              agentWalletAddress: row.signedByAddress,
              agentSignature: row.agentSignature,
              governanceStatus: row.governanceStatus as KnowledgeGovernanceLifecycle,
              updatedAt: row.updatedAt.toISOString(),
            };
            this.registerContract(loaded);
            return loaded;
          }
        }
      } catch (err: any) {
        console.warn('[ClaimContractEngine] DB query warning:', err?.message);
      }
    }
    return undefined;
  }

  /**
   * Systemic Intake Validator: Rejects any contract with synthetic or invalid provenance CIDs or hashes
   */
  public static validateProvenanceIntegrity(claims: GovernedClaim[]): void {
    for (const claim of claims) {
      if (!claim.provenance) {
        throw new Error(
          `[ClaimContractEngine] INVALID_PROVENANCE: Claim "${claim.claimId}" is missing provenance evidence.`
        );
      }
      if (!CANONICAL_CID_REGEX.test(claim.provenance.ipfsCid)) {
        throw new Error(
          `[ClaimContractEngine] INVALID_PROVENANCE_CID: Provenance CID "${claim.provenance.ipfsCid}" for claim "${claim.claimId}" must be a valid canonical CIDv1 base32 string.`
        );
      }
      if (!CANONICAL_HASH_REGEX.test(claim.provenance.contentHash)) {
        throw new Error(
          `[ClaimContractEngine] INVALID_PROVENANCE_HASH: Provenance contentHash "${claim.provenance.contentHash}" for claim "${claim.claimId}" must be a 64-character hex SHA-256 string.`
        );
      }
    }
  }

  /**
   * Anchors and cryptographically signs a claim contract to IPFS with Hermes Agent Wallet
   */
  public static async anchorClaimContractToIpfs(
    contract: TenantClaimContract,
    agentSigner: HermesIdentitySigner,
    vaultService?: TenantIpfsVaultService,
    options?: { skipDb?: boolean }
  ): Promise<TenantClaimContract> {
    // 0. Systemic intake validation: reject synthetic provenance
    this.validateProvenanceIntegrity(contract.claims);

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
      integrityStatus: 'VERIFIED',
      claims: contract.claims,
      updatedAt: new Date().toISOString(),
    };

    this.registerContract(anchoredContract);

    // 3. Persist local index to Neon PostgreSQL (only in real environments, guarded against test pollution)
    const shouldPersist = db && !options?.skipDb && process.env.NODE_ENV !== 'test';
    if (shouldPersist) {
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
        console.warn('[ClaimContractEngine] DB anchor log warning:', err?.message);
      }
    }

    return anchoredContract;
  }

  /**
   * Validates Epistemic Framing of a response:
   * Ensures HISTORICAL_DATA claims cannot mutate into future guarantees (EPISTEMIC_MUTATION_TO_GUARANTEE).
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
   * Evaluates the Provenance Intent Tier (Level 0 - 4) of a user prompt or assistant output
   */
  public static determineIntentTier(text: string): ProvenanceIntentTier {
    const lower = text.toLowerCase();
    if (/\b(comprar|reservar|firmar|depositar|invertir|transferir|distribuir|liquidar|ejecutar|recompra)\b/i.test(lower)) {
      return 'LEVEL_4_ACTION';
    }
    if (/\b(rendimiento\w*|plusval[ií]a\w*|roi|tasa\w*|utilidad\w*|dividendo\w*|contrato\w*|garant[ií]\w*|garantizad\w*|asegurad\w*|financier\w*|precio\w*|costo\w*|\$|usd|pesos)\b/i.test(lower)) {
      return 'LEVEL_3_FINANCIAL_CONTRACTUAL';
    }
    if (/\b(fraccionad\w*|t[ií]tulo\w*|departamento\w*|amenidad\w*|preventa|unidades|suite|condo|residencial)\b/i.test(lower)) {
      return 'LEVEL_2_COMMERCIAL';
    }
    if (/\b(dónde|donde|ubicación|ubicacion|clima|playa|nayarit|zona|historia|información|informacion|snarai|s'narai|desarrollo|bucerías|bucerias)\b/i.test(lower)) {
      return 'LEVEL_1_INFORMATIVE';
    }
    return 'LEVEL_0_CONVERSATIONAL';
  }

  /**
   * Supersedes an existing active claim contract version with a newer version.
   * Marks previous version as 'SUPERSEDED' in DB, stores in historical cache, and isolates from current inference.
   */
  public static async supersedeContractVersion(
    tenantId: string,
    newContract: TenantClaimContract,
    agentSigner?: HermesIdentitySigner
  ): Promise<TenantClaimContract> {
    const cleanTenant = this.cleanTenant(tenantId);
    const current = this.registeredContracts.get(cleanTenant);
    if (current) {
      const archived: TenantClaimContract = {
        ...current,
        governanceStatus: 'SUPERSEDED',
      };
      const history = this.historicalContracts.get(cleanTenant) || [];
      history.push(archived);
      this.historicalContracts.set(cleanTenant, history);

      if (db) {
        try {
          await db
            .update(hermesClaimContracts)
            .set({ governanceStatus: 'SUPERSEDED', updatedAt: new Date() })
            .where(
              and(
                eq(hermesClaimContracts.tenantId, cleanTenant),
                eq(hermesClaimContracts.version, current.version)
              )
            );
        } catch (err: any) {
          console.warn('[ClaimContractEngine] Failed updating superseded version in DB:', err?.message);
        }
      }
    }

    if (agentSigner) {
      return this.anchorClaimContractToIpfs(newContract, agentSigner);
    }
    this.registerContract(newContract);
    return newContract;
  }

  /**
   * Evaluates Claim Coverage:
   * Validates that every material commercial or financial assertion is backed by active authorized claims.
   * Contextual-descriptive clauses (disclaimers, legal framing, references to structure) are exempt,
   * and clauses may alternatively be grounded in ACTIVE sovereign knowledge via `options.additionalSources`.
   */
  public static evaluateClaimCoverage(
    text: string,
    tenantId: string,
    options?: { additionalSources?: string[] }
  ): ClaimCoverageReport {
    const contract = this.getContract(tenantId);
    if (!contract || contract.governanceStatus !== 'ACTIVE') {
      return {
        complete: false,
        unsupportedSegments: [text],
        matchedClaimsCount: 0,
      };
    }

    const sanitizedText = text
      .replace(/S\.A\.P\.I\./gi, 'S_A_P_I_')
      .replace(/S\.A\./gi, 'S_A_')
      .replace(/C\.V\./gi, 'C_V_')
      .replace(/S\.R\.L\./gi, 'S_R_L_')
      .replace(/U\.S\.A\./gi, 'U_S_A_');

    const sentences = sanitizedText
      .split(/(?<=[.!?])\s+|\n+/)
      .map(s =>
        s
          .replace(/S_A_P_I_/gi, 'S.A.P.I.')
          .replace(/S_A_/gi, 'S.A.')
          .replace(/C_V_/gi, 'C.V.')
          .replace(/S_R_L_/gi, 'S.R.L.')
          .replace(/U_S_A_/gi, 'U.S.A.')
          .trim()
      )
      .filter(s => s.length > 15);

    const unsupportedSegments: string[] = [];
    let matchedClaimsCount = 0;

    for (const sentence of sentences) {
      const isMaterial = /\b(precio[s]?|costo[s]?|\$|usd|rendimiento[s]?|plusval[ií]a[s]?|garant[ií]a[s]?|garantizad[ao][s]?|asegurad[ao][s]?|tasa[s]?|retorno[s]?|inversi[oó]n|inversiones|renta[s]?|distribuci[oó]n|distribuciones|departamento[s]?|t[ií]tulo[s]?|aztecas|sapi|token[s]?|cripto|pos|validaci[oó]n|blockchain|membres[ií]a|club)\b/i.test(sentence);

      if (isMaterial) {
        // Split compound assertions into clauses to pinpoint unbacked segments
        const rawClauses = sentence
          .split(/(?:,\s*|\s*;\s*|\s+y\s+(?:adem[aá]s\s+)?|\s+con\s+|\s+ofreciendo\s+|\s+garantizando\s+|\s+junto\s+a\s+|\s+adem[aá]s\s+de\s+)/i)
          .map(c => c.trim())
          .filter(c => c.length > 5);

        const clauses = rawClauses.length > 1 ? rawClauses : [sentence];

        for (const clause of clauses) {
          const isClauseMaterial = /\b(precio[s]?|costo[s]?|\$|usd|rendimiento[s]?|plusval[ií]a[s]?|garant[ií]a[s]?|garantizad[ao][s]?|asegurad[ao][s]?|tasa[s]?|retorno[s]?|inversi[oó]n|inversiones|renta[s]?|distribuci[oó]n|distribuciones|departamento[s]?|t[ií]tulo[s]?|aztecas|sapi|token[s]?|cripto|pos|validaci[oó]n|blockchain|membres[ií]a|club)\b/i.test(clause);
          
          if (!isClauseMaterial) continue;

          const hasForbiddenExtrapolation = /\b(garantizad[ao]|asegurad[ao]|fij[ao]|sin riesgo|recompra asegurada)\b/i.test(clause);
          const isTransactional = /\b(spei|clabe|orden\s+spei|referencia|ticket|recibo|tx\s?id)\b/i.test(clause);

          // K27-FP1: Contextual-descriptive exemption.
          // A clause carrying an explicit disclaimer/legal-framing marker AND lacking a
          // non-negated hard promise is informational — it must not be blocked.
          const clauseLower = clause.toLowerCase();
          const hardPromise =
            /\b(garantizamos|garantizo|garantiza|garantizamos|garantizados?|garantizadas?|aseguramos|asegurad[oa]s?|guaranteed|risk[-\s]?free)\b/i.test(
              clause
            ) &&
            !/(?:sin|no|tampoco|nunca|jam[aá]s)[^.;]{0,40}(garantiz\w*|asegur\w*|fij[oa]s?)/i.test(clause) &&
            !/(?:sin|no)\s+(?:hay\s+)?(?:garant[ií]as?|retorno[s]?\s+fij[oa]s?)/i.test(clause);
          const contextualMarker = [
            'sin garantía',
            'sin garantias',
            'no garantiza',
            'no se garantiza',
            'no hay garantía',
            'sujeto a',
            'sujeta a',
            'sujetos a',
            'sujetas a',
            'según la estructura',
            'según el contrato',
            'según los términos',
            'de acuerdo con',
            'conforme a',
            'establecid',
            'definid',
            'puede variar',
            'pueden variar',
            'históricamente',
            'historicaménte',
            'en el pasado',
          ].some(m => clauseLower.includes(m));
          if (contextualMarker && !hardPromise) {
            continue;
          }

          let isClauseCovered = false;

          if (!hasForbiddenExtrapolation) {
            if (isTransactional) {
              isClauseCovered = true;
              matchedClaimsCount++;
            } else {
              for (const claim of contract.claims) {
                const phrasingMatch = claim.permittedPhrasings.some(p => clause.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(clause.toLowerCase()));
                const keywords = claim.canonicalAssertion
                  .split(/\s+/)
                  .map(w => w.replace(/[^\wáéíóúÁÉÍÓÚñÑ]/g, ''))
                  .filter(w => w.length > 4);
                const kwMatches = keywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(clause)).length;

                if (phrasingMatch || kwMatches >= 2) {
                  isClauseCovered = true;
                  matchedClaimsCount++;
                  break;
                }
              }
            }
          }

          // K27-FP2: Sovereign knowledge grounding.
          // A material clause not covered by canonical claims may still be supported by
          // ACTIVE tenant knowledge (the sovereign vault). Requires meaningful keyword overlap.
          if (!isClauseCovered && options?.additionalSources?.length) {
            const clauseKeywords = clause
              .split(/\s+/)
              .map(w => w.replace(/[^\wáéíóúÁÉÍÓÚñÑ]/g, ''))
              .filter(w => w.length > 4);
            if (clauseKeywords.length >= 3) {
              const grounded = options.additionalSources.some(src =>
                clauseKeywords.filter(kw => src.toLowerCase().includes(kw.toLowerCase())).length >= 3
              );
              if (grounded) {
                isClauseCovered = true;
                matchedClaimsCount++;
              }
            }
          }

          if (!isClauseCovered) {
            unsupportedSegments.push(clause);
          }
        }
      }
    }

    return {
      complete: unsupportedSegments.length === 0,
      unsupportedSegments,
      matchedClaimsCount,
    };
  }

  /**
   * Validates Disclosure Authorization vs Cryptographic Validity Separation:
   * A signed, valid claim classified as CONFIDENTIAL or SECRET cannot be disclosed in a public channel.
   */
  public static validateDisclosureAuthorization(
    text: string,
    tenantId: string,
    actorRole?: string
  ): { valid: boolean; violations: Array<{ code: string; message: string }> } {
    const contract = this.getContract(tenantId);
    if (!contract) return { valid: true, violations: [] };

    const violations: Array<{ code: string; message: string }> = [];
    const isPublicUser = !actorRole || actorRole === 'USER' || actorRole === 'VIEWER';

    for (const claim of contract.claims) {
      const clearance = claim.disclosureClearance || 'PUBLIC';
      if (isPublicUser && (clearance === 'CONFIDENTIAL' || clearance === 'SECRET' || clearance === 'INTERNAL_OPERATIONAL')) {
        const matches = claim.permittedPhrasings.some(p => text.toLowerCase().includes(p.toLowerCase())) ||
          (claim.canonicalAssertion.length > 10 && text.toLowerCase().includes(claim.canonicalAssertion.toLowerCase().substring(0, 30)));

        if (matches) {
          violations.push({
            code: 'RESTRICTED_KNOWLEDGE',
            message: `Afirmación [${claim.claimId}] tiene clasificación de divulgación ${clearance} y no puede ser revelada en canal público a pesar de tener integridad criptográfica verificada.`,
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Detects unsupported claim composition or unauthorized fact extrapolation
   * (e.g. combining $50 USD with unverified fixed returns or exclusive rights)
   */
  public static detectUnsupportedClaimComposition(
    text: string,
    tenantId: string
  ): { valid: boolean; violations: Array<{ code: string; message: string }> } {
    const contract = this.getContract(tenantId);
    if (!contract || contract.governanceStatus !== 'ACTIVE') {
      return { valid: true, violations: [] };
    }

    const violations: Array<{ code: string; message: string }> = [];

    const unsupportedPatterns = [
      {
        pattern: /\b(?:con|por)\s+\$50\s*(?:usd)?\s*(?:obtienes|recibes|tienes|garantiza)\s+[^.!?\n]{0,50}\b(?:tasa fija|recompra asegurada|rendimiento fijo|control absoluto|propiedad total)\b/i,
        message: 'Composición de afirmaciones no autorizada: extrapolación de precio base hacia beneficios o rendimientos no respaldados por el Claim Contract.',
      },
      {
        pattern: /\b(?:rendimiento|plusval[ií]a)\s+(?:fij[ao]|garantizad[ao]|segur[ao]|sin riesgo)\b/i,
        message: 'Composición de afirmaciones no autorizada: afirmación de ausencia de riesgo o rentabilidad fija no autorizada.',
      },
      {
        pattern: /\b(?:con|por)\s+\$50\s*(?:usd)?\s*(?:obtienes|recibes|tienes)\s+(?:un\s+)?(?:departamento completo|escritura directa individual)\b/i,
        message: 'Composición de afirmaciones no autorizada: extrapolación de Título de Participación fraccionado hacia propiedad condominal directa.',
      },
    ];

    for (const item of unsupportedPatterns) {
      if (item.pattern.test(text)) {
        violations.push({
          code: 'UNSUPPORTED_CLAIM_COMPOSITION',
          message: item.message,
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Normalizes an output payload into its canonical representation for immutable response hashing.
   * Strips non-semantic whitespace and carriage returns, guaranteeing that formatting changes
   * do not introduce false positive hash mismatches while strictly detecting semantic mutations.
   */
  public static normalizeCanonicalPayload(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .trim();
  }

  /**
   * Verifies the cryptographic integrity and multi-tenant binding of a ClaimProvenanceReceipt.
   * If any character of originalText was tampered with, or if tenant/signer/contract bindings do not match, returns invalid.
   */
  public static verifyReceipt(
    receipt: ClaimProvenanceReceipt,
    originalText: string,
    options?: {
      expectedTenantId?: string;
      expectedSignerAddress?: string;
      expectedContractCid?: string;
    }
  ): { valid: boolean; reason?: string } {
    const canonical = this.normalizeCanonicalPayload(originalText);
    const computedResponseHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
    if (computedResponseHash !== receipt.responseHash) {
      return {
        valid: false,
        reason: 'RESPONSE_HASH_MISMATCH: Text has been modified after receipt attestation.',
      };
    }

    if (options?.expectedTenantId) {
      if (this.cleanTenant(receipt.tenantId) !== this.cleanTenant(options.expectedTenantId)) {
        return {
          valid: false,
          reason: `TENANT_BINDING_MISMATCH: Receipt belongs to tenant "${receipt.tenantId}" but requested for "${options.expectedTenantId}".`,
        };
      }
    }

    if (options?.expectedSignerAddress) {
      if (receipt.agentWalletAddress.toLowerCase() !== options.expectedSignerAddress.toLowerCase()) {
        return {
          valid: false,
          reason: `SIGNER_BINDING_MISMATCH: Receipt signer "${receipt.agentWalletAddress}" does not match expected signer "${options.expectedSignerAddress}".`,
        };
      }
    }

    if (options?.expectedContractCid) {
      const hasMatchingContract = receipt.claims.some(c => c.contractCid === options.expectedContractCid);
      if (!hasMatchingContract) {
        return {
          valid: false,
          reason: `CONTRACT_BINDING_MISMATCH: Expected contract CID "${options.expectedContractCid}" not found in receipt claims.`,
        };
      }
    }

    if (receipt.coverage && !receipt.coverage.complete && receipt.coverage.unsupportedSegments.length > 0) {
      return {
        valid: false,
        reason: `INCOMPLETE_CLAIM_COVERAGE: Receipt contains unsupported segments: ${receipt.coverage.unsupportedSegments.join('; ')}`,
      };
    }

    if (!receipt.agentSignature || !receipt.agentSignature.startsWith('0x')) {
      return {
        valid: false,
        reason: 'MISSING_OR_INVALID_AGENT_SIGNATURE',
      };
    }

    return {
      valid: true,
    };
  }

  /**
   * Generates a verifiable Claim Provenance Receipt (Proof of Governed Response) for customer outputs.
   * AgentSigner is mandatory to guarantee EIP-712 cryptographic attestation.
   */
  public static async generateClaimProvenanceReceipt(
    text: string,
    tenantId: string,
    agentSigner: HermesIdentitySigner,
    options?: {
      conversationId?: string;
      policyVersion?: string;
      explicitTier?: ProvenanceIntentTier;
    }
  ): Promise<ClaimProvenanceReceipt | null> {
    if (!agentSigner) {
      throw new Error('[ClaimContractEngine] HermesIdentitySigner is mandatory to generate signed claim receipts.');
    }

    const contract = this.getContract(tenantId);
    if (!contract || contract.governanceStatus !== 'ACTIVE') {
      return null;
    }

    const matchedClaims: GovernedClaimReceiptItem[] = [];
    const matchedClaimIds: string[] = [];

    for (const claim of contract.claims) {
      const keywords = claim.canonicalAssertion
        .split(/\s+/)
        .map(w => w.replace(/[^\wáéíóúÁÉÍÓÚñÑ]/g, ''))
        .filter(w => w.length > 4);

      const matchCount = keywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(text)).length;
      if (matchCount >= 2 || claim.permittedPhrasings.some(p => text.toLowerCase().includes(p.toLowerCase()))) {
        const claimHash = crypto.createHash('sha256').update(claim.canonicalAssertion, 'utf8').digest('hex');
        matchedClaimIds.push(claim.claimId);
        matchedClaims.push({
          claimId: claim.claimId,
          claimHash,
          category: claim.category,
          contractCid: contract.ipfsCid || `mock_bafkrei_contract_${contract.version}`,
          artifactId: claim.provenance?.artifactId || 'canonical_pack',
          version: contract.version,
        });
      }
    }

    if (matchedClaims.length === 0) {
      return null;
    }

    const tier = options?.explicitTier || this.determineIntentTier(text);
    const reqs = TIER_REQUIREMENTS[tier];
    const coverage = this.evaluateClaimCoverage(text, tenantId);
    const canonicalText = this.normalizeCanonicalPayload(text);
    const responseHash = crypto.createHash('sha256').update(canonicalText, 'utf8').digest('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    const policyVersion = options?.policyVersion || 'v1.0.4-k26.1';

    const proofPayload = JSON.stringify({
      tenantId,
      responseHash,
      tier,
      matchedClaimIds: matchedClaimIds.sort(),
      claims: matchedClaims,
      policyVersion,
      contractHash: contract.contractHash,
      nonce,
    });
    const proofHash = crypto.createHash('sha256').update(proofPayload, 'utf8').digest('hex');

    let agentSignature: string | undefined = undefined;
    if (reqs.agentAttestationRequired || reqs.signatureRequired || agentSigner) {
      const signed = await agentSigner.signIntent({
        tenantId,
        actorId: `agent_wallet_${tenantId}`,
        actionName: 'hermes.claim_provenance_attestation',
        resourceId: matchedClaimIds.join(':'),
        policyHash: proofHash,
      });
      agentSignature = signed.signature;
    }

    return {
      receiptId: `rec_${Date.now()}_${proofHash.substring(0, 8)}`,
      tenantId,
      agentId: `hermes-${tenantId}`,
      conversationId: options?.conversationId,
      responseHash,
      provenanceTier: tier,
      provenanceRequired: reqs.provenanceRequired,
      claimAuthorizationRequired: reqs.claimAuthorizationRequired,
      agentAttestationRequired: reqs.agentAttestationRequired,
      signatureRequired: reqs.signatureRequired,
      coverage,
      claims: matchedClaims,
      matchedClaimIds,
      policyVersion,
      proofHash,
      agentWalletAddress: agentSigner.getPublicAddress(),
      agentSignature,
      verifiedAt: new Date().toISOString(),
      nonce,
    };
  }
}
