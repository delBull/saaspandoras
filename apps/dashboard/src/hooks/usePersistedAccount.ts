"use client";

import { useEffect, useCallback, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

export function usePersistedAccount() {
  const account = useActiveAccount();
  const [savedWalletAddress, setSavedWalletAddress] = useState<string | null>(null);

  // Guardar en cookie cuando conecte
  useEffect(() => {
    if (account?.address && typeof window !== "undefined") {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      document.cookie = `wallet-address=${account.address}; path=/; expires=${expires.toUTCString()}; Secure; SameSite=Strict`;
      setSavedWalletAddress(account.address);
      console.log("💾 Guardada wallet en cookie:", account.address);
    }
  }, [account?.address]);

  // Cargar cookie al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = document.cookie
        .split("; ")
        .find((row) => row.startsWith("wallet-address="))
        ?.split("=")[1];

      if (saved && saved !== "undefined" && saved !== "null") {
        setSavedWalletAddress(saved);
        console.log("🔍 Wallet guardada encontrada:", saved);
      }
    }
  }, []);

  // Logging para debugging de sesión
  useEffect(() => {
    if (savedWalletAddress && !account?.address) {
      console.log("🔄 Wallet guardada detectada:", savedWalletAddress);
      console.log("💡 Usuario debe reconectar manualmente para restaurar la sesión");
    }
  }, [savedWalletAddress, account?.address]);

  // Logout
  const logout = useCallback(() => {
    console.log("🚪 Cerrando sesión de wallet");
    if (typeof window !== "undefined") {
      document.cookie = `wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      setSavedWalletAddress(null);
    }
    // Nota: El disconnect se debe hacer en el componente que tiene acceso al wallet
  }, []);

  return {
    account,
    logout,
    savedWalletAddress,
    hasSavedWallet: !!savedWalletAddress,
    canAutoReconnect: !account?.address && !!savedWalletAddress,
  };
}