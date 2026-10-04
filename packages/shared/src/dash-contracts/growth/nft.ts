/**
 * 📦 Dash Contracts — Growth NFT Lab & Smart Passes
 * src/lib/dash-contracts/growth/nft.ts
 *
 * Taxonomy aligned with Phase 0 Architecture Audit:
 *   - NftPurpose  = business purpose (what the NFT means)
 *   - NftStandard = technical standard (how it's implemented)
 *   - NftBehavior = behavioral flags (how it acts)
 *
 * NOTE: YIELD_SHARE intentionally excluded — regulatory risk pending product/legal decision.
 * NOTE: SOULBOUND is NOT a purpose; it's transferable=false on-chain via PandorasKey contract.
 */

// ── Business Purpose ───────────────────────────────────────────────────────
// Maps to ArtifactType in @pandoras/protocol-deployer (extended)
export type NftPurpose =
  | 'ACCESS'       // Temporal or renewable access pass (deployer: 'Access')
  | 'IDENTITY'     // Non-transferable identity credential (deployer: 'Identity' / PandorasKey)
  | 'MEMBERSHIP'   // Club/DAO membership (deployer: 'Membership')
  | 'REWARD'       // Loyalty/coupon (deployer: 'Coupon')
  | 'REPUTATION'   // Non-transferable achievement/credential (deployer: 'Reputation')
  | 'COLLECTIBLE'  // Limited-edition collectible
  | 'EXPERIENCE'   // Event, booking, or time-specific experience
  | 'GOVERNANCE';  // On-chain voting power (DAO pass)

// Legacy alias for backward compatibility with older routes
export type NftType = NftPurpose;

// ── Technical Standard ────────────────────────────────────────────────────
export type NftStandard = 'ERC-721' | 'ERC-1155' | 'SBT';

// ── Lifecycle Status ──────────────────────────────────────────────────────
export type NftCollectionStatus =
  | 'DRAFT'               // Created, not yet submitted to governance
  | 'GOVERNANCE_PENDING'  // Submitted, awaiting approval
  | 'DEPLOYED'            // Contract live on-chain
  | 'PAUSED'              // Minting paused
  | 'RETIRED';            // No longer active

// ── Collection DTO (DB-backed, tenant-scoped) ────────────────────────────
export interface NftCollectionDTO {
  id: string;                      // UUID from tenant_nft_collections
  organizationId: string;          // Canonical org (server-authoritative)
  name: string;
  symbol: string;
  purpose: NftPurpose;
  standard: NftStandard;
  transferable: boolean;           // false = non-transferable on-chain (NOT "Soulbound" label unless deployed as SBT)
  burnable: boolean;
  expirable: boolean;
  revokable: boolean;
  contractAddress?: string;        // Only present when status = DEPLOYED
  chainId: number;
  totalSupply: number;             // 0 = unlimited
  mintedSupply: number;            // COUNT from tenant_nft_issuances
  royaltyFeeBps: number;
  status: NftCollectionStatus;
  governanceIntentId?: string;
  imageIpfsCid?: string;
  metadataIpfsCid?: string;
  deployTxHash?: string;
  config?: Record<string, unknown>; // Purpose-specific config (expiresInDays, accessLevel, etc.)
  createdAt: string;
}

// ── Issuance DTO (individual token mint record) ──────────────────────────
export interface NftIssuanceDTO {
  id: string;
  collectionId: string;
  recipientWallet: string;
  tokenId?: string;
  mintTxHash?: string;
  mintedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  status: 'pending_mint' | 'minted' | 'expired' | 'revoked';
  metadata?: Record<string, unknown>;
}

// ── API Response DTOs ─────────────────────────────────────────────────────
export interface GetNftLabResponseDTO {
  collections: NftCollectionDTO[];
  supportedChains: Array<{ id: number; name: string; isTestnet: boolean }>;
}

export interface CreateNftCollectionResponseDTO {
  success: boolean;
  collectionId: string;
  status: NftCollectionStatus;
  governanceIntentId: string;
  message: string;
}

export interface MintNftResponseDTO {
  success: boolean;
  issuanceId: string;
  governanceIntentId?: string;    // Present when governance required
  autoExecuted: boolean;          // True when within collection policy
  message: string;
}
