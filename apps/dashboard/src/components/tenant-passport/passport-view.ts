/**
 * Tenant Passport — Fase 1 (Bento Vault & Visual Overhaul)
 * Contrato de vista de presentación. Todo bloque porta una
 * explícita (loading | available | empty | unavailable | restricted).
 * Este contrato NUNCA debe derivarse de datos inventados.
 */

export type BlockState =
  | 'loading'
  | 'available'
  | 'empty'
  | 'unavailable'
  | 'restricted';

export type PassportAssetKind =
  | 'certificate'
  | 'membership'
  | 'ownership'
  | 'benefit'
  | 'participation';

export type PassportAssetStatus = 'active' | 'pending' | 'expired' | 'unknown';

export interface PassportAsset {
  id: string;
  title: string;
  kind: PassportAssetKind;
  status: PassportAssetStatus;
  detail?: string;
  cid?: string | null;
  explorerUrl?: string | null;
  units?: number;
  amountUsd?: number;
  date?: string | Date;
  agreementHash?: string | null;
  legalPortalUrl?: string | null;
  isVirtual?: boolean;
  votingPower?: number;
  badge?: string;
}

export interface AssetBlock {
  state: BlockState;
  assets?: PassportAsset[];
  totalUnits?: number;
  totalValueUsd?: number;
  message?: string;
}

export interface PerkItem {
  id: string;
  title: string;
  description?: string;
  unlocked: boolean;
  minUnits?: number;
  badge?: string;
}

export interface PerksBlock {
  state: BlockState;
  currentTier?: string;
  nextTier?: string;
  perks?: PerkItem[];
  progressPercentage?: number;
  message?: string;
}

export interface RewardsBlock {
  state: BlockState;
  rewardsDisplay?: string;
  rewardsValue?: number;
  canClaim?: boolean;
  currency?: string;
  votingPower?: number;
  message?: string;
}

export interface ActivityItemState {
  id: string;
  title: string;
  at: string | Date;
  state: 'confirmed' | 'pending' | 'failed' | 'unknown';
  detail?: string;
}

export interface ActivityBlock {
  state: BlockState;
  items?: ActivityItemState[];
  message?: string;
}

export interface LoyaltyBlock {
  state: BlockState;
  userId: string;
  message?: string;
}

export interface PlatformHealthBlock {
  state: BlockState;
  systemStatus?: string;
  journeyStatus?: string;
  organizationName: string;
  isSimulationMode?: boolean | null;
  message?: string;
}