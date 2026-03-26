/**
 * 🛰️ ACCESS STATE MACHINE
 * ============================================================================
 * Centralized logic for the Pandora's Access Funnel.
 * This is the "Clinical Resolver" that eliminates condition soup.
 */

import { AuthStatus, User } from "@/components/auth/AuthProvider";

export enum AccessState {
  LOADING = "LOADING",                  // Initial boot / checking session
  NO_WALLET = "NO_WALLET",              // Guest (no account)
  NO_SESSION = "NO_SESSION",            // Wallet connected but no valid JWT
  WALLET_NO_ACCESS = "WALLET_NO_ACCESS",// Connected but no Genesis NFT
  HAS_ACCESS = "HAS_ACCESS",            // Fully authenticated + NFT
  ADMIN = "ADMIN",                      // Bypassed (Staging/SuperAdmin/EasterEgg)
  ERROR = "ERROR",                      // Fatal breakdown
}

type Params = {
  status: AuthStatus;
  user: User | null;
  isAdmin: boolean;
  remoteState?: AccessState | null; // 🛰️ Backend authority signal
};

/**
 * PURE FUNCTION: Resolves the deterministic state of a user's access.
 */
export function resolveAccessState({ status, user, isAdmin, remoteState }: Params): AccessState {
  // 1. Loading States (Block the UI)
  if (
    status === "booting" ||
    status === "checking_session" ||
    status === "checking_access" ||
    status === "signing"
  ) {
    return AccessState.LOADING;
  }

  // 2. Error Handling (Safety First)
  if (status === "error") {
    return AccessState.ERROR;
  }

  // 🛡️ RESILIENT REMOTE AUTHORITY: Only obey valid, non-error remote states
  // If backend is down/compromised, we fallback to local derived logic.
  if (remoteState && remoteState !== AccessState.ERROR) {
    return remoteState;
  }

  // 3. Identification
  const hasWallet = !!user?.address;

  // 4. Genuine Access (NFT Present)
  // FIX: Prioritize has_access to preserve metrics/tiers even for admins.
  if (status === "has_access") {
    // If they have the NFT, they are HAS_ACCESS (or ADMIN if they are also admins)
    // but the key is recognizing the HAS_ACCESS first.
    return isAdmin ? AccessState.ADMIN : AccessState.HAS_ACCESS;
  }

  // 5. Admin Bypass (Elite Rule: Requires Wallet)
  // If they don't have the NFT but ARE admins (staging/egg), they get the ADMIN state.
  if (isAdmin && hasWallet) {
    return AccessState.ADMIN;
  }

  // 6. No Wallet
  if (!hasWallet) {
    return AccessState.NO_WALLET;
  }

  // 7. Default: Connected but no access
  return AccessState.WALLET_NO_ACCESS;
}
