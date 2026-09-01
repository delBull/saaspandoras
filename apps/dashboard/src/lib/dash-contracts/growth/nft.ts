/**
 * 📦 Dash Contracts — Growth NFT Lab & Smart Passes
 * src/lib/dash-contracts/growth/nft.ts
 */

export type NftType = 'UTILITY' | 'CERTIFICATE' | 'MEMBERSHIP' | 'FOUNDER_PASS' | 'YIELD_SHARE';

export interface NftCollectionDTO {
  id: string;
  name: string;
  symbol: string;
  type: NftType;
  contractAddress?: string;
  chainId: number;
  totalSupply: number;
  mintedSupply: number;
  royaltyFeeBps: number;
  status: 'DEPLOYED' | 'DRAFT' | 'ACTIVE';
  metadataIpfsCid?: string;
  createdAt: string;
}

export interface GetNftLabResponseDTO {
  collections: NftCollectionDTO[];
  supportedChains: Array<{ id: number; name: string; isTestnet: boolean }>;
}
