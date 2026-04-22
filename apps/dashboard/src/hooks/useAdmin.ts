'use client';

import { useActiveAccount } from "thirdweb/react";
import { useState, useEffect } from "react";

/**
 * 🛡️ useAdmin — Unified Admin & Bypass Logic
 * ============================================================================
 * Centralizes the three ways an admin can bypass the access gates:
 * 1. Staging Environment: Always open (via branch detection matching config.ts)
 * 2. Super Admin Wallets: Explicitly listed in env
 * 3. Easter Egg: localStorage 'pandoras_bypass' set to 'true'
 * ============================================================================
 */
export function useAdmin() {
  const account = useActiveAccount();
  // Sync staging detection with config.ts logic
  const branchName = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 'main';
  const isStaging = branchName === 'staging' || process.env.NEXT_PUBLIC_APP_ENV === "staging";
  
  const superAdminWallet = (process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET || process.env.SUPER_ADMIN_WALLET)?.toLowerCase();
  const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").toLowerCase().split(",");
  
  const isSuperAdmin = !!account && !!superAdminWallet && account.address.toLowerCase() === superAdminWallet;
  const isListedAdmin = !!account && adminWallets.includes(account.address.toLowerCase());

  // ✅ STRICT DETERMINISTIC ACCESS:
  // Only SuperAdmin or ListedAdmin (from server-side env) are allowed.
  const isAdmin = isSuperAdmin || isListedAdmin;

  return {
    isAdmin,
    isSuperAdmin,
    isStaging,
    account
  };
}
