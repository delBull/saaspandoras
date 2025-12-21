"use client";

import { useEffect, useCallback, useState } from "react";
import { useActiveAccount, useActiveWallet, useConnect, useDisconnect } from "thirdweb/react";
import { createWallet, type WalletId, smartWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { accountAbstractionConfig } from "@/config/wallets";

interface SavedSession {
  address: string;
  walletType: WalletId;
  shouldReconnect: boolean;
  isSocial?: boolean;
}

export function usePersistedAccount() {
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { connect, isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [session, setSession] = useState<SavedSession | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState<number | null>(null);
  const [isLogoutInProgress, setIsLogoutInProgress] = useState(false);

  // 🚀 Bootstrapping inicial desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wallet-session");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as SavedSession;
          // Para social logins, permitir shouldReconnect pero marcarlos específicamente
          const walletTypeStr = String(parsed.walletType);
          const isSocialWallet = walletTypeStr.includes('inApp') ||
            walletTypeStr.includes('inAppWallet') ||
            walletTypeStr === 'email' ||
            walletTypeStr === 'google' ||
            walletTypeStr === 'apple' ||
            walletTypeStr === 'facebook' ||
            walletTypeStr.includes('social');

          if (isSocialWallet) {
            // Para social logins, mantener shouldReconnect pero marcar como social
            const socialSession = { ...parsed, isSocial: true };
            setSession(socialSession);
            if (process.env.NODE_ENV === 'development') {
              console.log("🔄 Sesión social encontrada:", parsed.walletType);
            }
          } else {
            setSession(parsed);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("⚠️ Sesión guardada corrupta, limpiando:", error);
          }
          localStorage.removeItem("wallet-session");
        }
      }
      setIsBootstrapped(true);
    }
  }, []);

  // Guardar sesión activa para wallets reales (MetaMask, etc.)
  useEffect(() => {
    // If explicitly logged out, do not auto-save (waiting for disconnect to happen)
    // NOTE: The 'wallet-logged-out' flag must be cleared by the Connect UI action. 
    // If we are here and the flag exists, it means we are likely in an auto-connect state that we want to reject.
    const isLoggedOut = typeof window !== "undefined" && localStorage.getItem("wallet-logged-out") === "true";
    if (isLoggedOut && account?.address) {
      console.log("🛑 Detected explicit logout flag - ignoring auto-save and awaiting disconnect...");
      return;
    }

    if (account?.address && activeWallet && typeof window !== "undefined") {
      const walletTypeStr = String(activeWallet.id);
      const isSocial = walletTypeStr.includes('inApp') ||
        walletTypeStr.includes('inAppWallet') ||
        walletTypeStr === 'email' ||
        walletTypeStr === 'google' ||
        walletTypeStr === 'apple' ||
        walletTypeStr === 'facebook' ||
        walletTypeStr.includes('social');

      const data: SavedSession = {
        address: account.address,
        walletType: activeWallet.id,
        // Permitir reconexión automática para TODAS las wallets usando sesión del servidor
        shouldReconnect: true,
        isSocial,
      };

      // Save to localStorage
      localStorage.setItem("wallet-session", JSON.stringify(data));
      // Ensure logout flag is cleared if we are successfully saving a valid session (meaning user manually reconnected or we accepted it)
      // BUT: We rely on UI to clear the flag to distinguish Manual vs Auto. 
      // If we clear it here, we defeat the blocking logic above. 
      // EXCEPT: If we reached here, how do we know if it's manual? 
      // We don't. So we must NOT clear it here if it exists. 
      // If it DOESN'T exist, we proceed.

      // Also save wallet address to cookies for server-side access
      document.cookie = `wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;
      document.cookie = `thirdweb:wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;

      setSession(data);
      if (process.env.NODE_ENV === 'development') {
        console.log("💾 Guardada sesión wallet real:", data.walletType);
        console.log("🍪 Wallet address set in cookies for server access");
      }
    }
  }, [account?.address, activeWallet]);

  // Force Disconnect Check
  useEffect(() => {
    if (typeof window !== "undefined" && account?.address && activeWallet) {
      if (localStorage.getItem("wallet-logged-out") === "true") {
        console.log("🚫 Enforcing explicit logout - Disconnecting...");
        disconnect(activeWallet);
        // Do NOT clear the flag yet, wait until user manually connects (which should clear it)
      }
    }
  }, [account, activeWallet, disconnect]);

  // Guardar sesión para social logins (cuando hay account pero no activeWallet)
  useEffect(() => {
    const isLoggedOut = typeof window !== "undefined" && localStorage.getItem("wallet-logged-out") === "true";
    if (isLoggedOut && account?.address) return;

    if (account?.address && !activeWallet && typeof window !== "undefined") {
      // Si hay cuenta conectada pero no activeWallet, asumimos que es social login
      // Intentamos detectar el tipo basado en posibles datos o usamos 'inApp' como fallback
      const walletType: WalletId = 'inApp'; // Fallback para social buttons

      const data: SavedSession = {
        address: account.address,
        walletType,
        // Social logins ahora SÍ se reconectan automáticamente usando sesión del servidor
        shouldReconnect: true,
        isSocial: true,
      };

      // Save to localStorage
      localStorage.setItem("wallet-session", JSON.stringify(data));

      // Also save wallet address to cookies for server-side access
      document.cookie = `wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;
      document.cookie = `thirdweb:wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;

      setSession(data);
      if (process.env.NODE_ENV === 'development') {
        console.log("💾 Guardada sesión social login:", data.walletType);
        console.log("🍪 Wallet address set in cookies for server access");
      }
    }
  }, [account?.address, activeWallet]);

  // ... (Rehydration logic remains similar)

  // Logout - Limpia completamente la sesión
  const logout = useCallback(() => {
    console.log("🚪 Cerrando sesión de wallet");
    setIsLogoutInProgress(true);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("wallet-logged-out", "true"); // SET FLAG
      }

      // Ejecutar disconnect inmediatamente (no es async)
      if (activeWallet) {
        disconnect(activeWallet);
      }

      // Limpiar localStorage y cookies completamente después del disconnect
      if (typeof window !== "undefined") {
        localStorage.removeItem("wallet-session");
        localStorage.removeItem("wallet-address");

        // Clear wallet cookies
        document.cookie = "wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "thirdweb:wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        setSession(null);
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("⚠️ Error durante logout:", error);
      }
    } finally {
      // Reset del flag de logout inmediatamente después de la limpieza
      setTimeout(() => {
        setIsLogoutInProgress(false);
      }, 500);
    }
  }, [disconnect, activeWallet]);

  return {
    account,
    logout,
    savedWalletAddress: session?.address ?? null,
    hasSavedWallet: !!session?.address,
    canAutoReconnect: !account?.address && !!session?.shouldReconnect,
    isBootstrapped,
    isConnecting,  // 👈 Expose connection status
  };
}
