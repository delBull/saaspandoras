/**
 * NFT Growth Capability Layer — barrel export
 * lib/growth/nft/index.ts
 */

export { NftCapability } from './nft-capability';
export type {
  CreateCollectionResult,
  IssueTokenResult,
  RevokeTokenResult,
  CollectionSummary,
} from './nft-capability';

export { NftPolicyEngine, NFT_CAPABILITIES } from './nft-policy-engine';
export type { NftCapabilityId, PolicyDecision, NftPolicyResult } from './nft-policy-engine';

export { verifyNftAccess, verifyOnchainOwnership, verifyDbIssuance } from './token-gate';
export type { TokenGateResult } from './token-gate';

export { NftLabActivationService } from './nft-lab-activation.service';
export type { NftLabActivationInput, NftLabActivationResult } from './nft-lab-activation.service';
