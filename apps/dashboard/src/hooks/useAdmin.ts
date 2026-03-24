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
  const [hasBypass, setHasBypass] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('pandoras_bypass') === 'true') {
      setHasBypass(true);
    }
  }, []);

  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";
  
  const superAdminWallet = process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET?.toLowerCase();
  const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").toLowerCase().split(",");
  
  const isSuperAdmin = !!account && !!superAdminWallet && account.address.toLowerCase() === superAdminWallet;
  const isListedAdmin = !!account && adminWallets.includes(account.address.toLowerCase());

  const isAdmin = isStaging || isSuperAdmin || isListedAdmin || hasBypass;

  return {
    isAdmin,
    isSuperAdmin,
    isStaging,
    hasBypass,
    account
  };
}
