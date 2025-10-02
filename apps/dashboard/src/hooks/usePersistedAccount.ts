"use client";

import { useEffect, useCallback, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

export function usePersistedAccount() {
  const account = useActiveAccount();
  const [savedWalletAddress, setSavedWalletAddress] = useState<string | null>(null);

  // 1. Guardar la wallet en cookies al conectar
  useEffect(() => {
    if (account?.address && typeof window !== 'undefined') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // Cookie expires in 7 days
      document.cookie = `wallet-address=${account.address}; path=/; expires=${expires.toUTCString()}; Secure; SameSite=Strict`;
      setSavedWalletAddress(account.address);
      console.log("💾 Wallet address saved to cookie:", account.address);
    }
  }, [account?.address]);

  // 2. Cargar wallet guardada al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = document.cookie
        .split("; ")
        .find(row => row.startsWith("wallet-address="))
        ?.split("=")[1];

      if (saved && saved !== 'undefined' && saved !== 'null') {
        setSavedWalletAddress(saved);
        console.log("🔍 Saved wallet found:", saved);
      }
    }
  }, []);

  // 3. Trigger admin verification when saved wallet is detected
  useEffect(() => {
    if (savedWalletAddress && !account?.address) {
      console.log("🔄 Wallet guardada detectada:", savedWalletAddress);
      console.log("💡 Wallet disponible para reconexión automática");

      // Store the saved wallet address in sessionStorage for the sidebar to use
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingWalletAddress', savedWalletAddress);
      }
    }
  }, [savedWalletAddress, account?.address]);

  // 4. Logout manual: limpiar cookie y recargar
  const logout = useCallback(() => {
    console.log("🚪 Cerrando sesión de wallet");
    if (typeof window !== 'undefined') {
      document.cookie = `wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      setSavedWalletAddress(null);
      window.location.reload(); // Recargar para limpiar el estado
    }
  }, []);

  return {
    account,
    logout,
    savedWalletAddress,
    hasSavedWallet: !!savedWalletAddress,
    canAutoReconnect: !account?.address && !!savedWalletAddress
  };
}