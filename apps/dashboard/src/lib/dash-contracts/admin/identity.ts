/**
 * 🏛️ PLATFORM GOVERNANCE CONTRACTS: IDENTITY
 * apps/dashboard/src/lib/dash-contracts/admin/identity.ts
 *
 * Defines platform actor identities, sovereign roles, session tokens
 * and administrator authority boundaries.
 */

export type PlatformRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'MARKETING' | 'VIEWER';

export type PlatformActorType = 'WALLET' | 'MAGIC_LINK' | 'SYSTEM_CRON' | 'AGENT_DELEGATE';

export interface PlatformActor {
  id: string;
  actorType: PlatformActorType;
  role: PlatformRole;
  walletAddress?: string | null;
  email?: string | null;
  name?: string | null;
  sessionStartedAt: string;
  isDiscord2faVerified: boolean;
}

export interface AdministratorRecord {
  id: number;
  walletAddress: string;
  role: PlatformRole;
  name?: string | null;
  addedByWallet: string;
  createdAt: string;
  lastActiveAt?: string | null;
}

export interface PlatformAuthVerificationResult {
  isAuthorized: boolean;
  actor: PlatformActor | null;
  denialReason?: string;
}
