'use client';

import { useActiveAccount } from "thirdweb/react";
import { useState, useEffect } from "react";

/**
 * 🛡️ useAdmin — Unified Admin & Bypass Logic
 * ============================================================================
 * Centralizes the three ways an admin can bypass the access gates:
 * 1. Staging Environment: Always open (if NEXT_PUBLIC_APP_ENV === 'staging')
 * 2. Super Admin Wallets: Explicitly listed in env
 * 3. Easter Egg: localStorage 'pandoras_bypass' set to 'true'
 * ============================================================================
 */
export function useAdmin() {
  const account = useActiveAccount();
  const [hasBypass, setHasBypass] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('pandoras_bypass') === 'true';
      setHasBypass(val);
    }
  }, []);

  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";
  
  const superAdminWallet = process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET?.toLowerCase();
  const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").toLowerCase().split(",");
  
  const isSuperAdmin = !!account && !!superAdminWallet && account.address.toLowerCase() === superAdminWallet;
  const isListedAdmin = !!account && adminWallets.includes(account.address.toLowerCase());

  // ✅ ELITE DETERMINISTIC BYPASS (Level 11):
  // 1. If bypass check is pending (null), it's false
  // 2. Staging ONLY bypasses if wallet is connected
  // 3. SuperAdmin/ListedAdmin require wallet
  // 4. Easter Egg (hasBypass) ONLY bypasses if wallet is connected
  const isAdmin = hasBypass === null 
    ? false 
    : ((!!account && isStaging) || isSuperAdmin || isListedAdmin || (hasBypass && !!account));

  return {
    isAdmin,
    isSuperAdmin,
    isStaging,
    hasBypass,
    account
  };
}
