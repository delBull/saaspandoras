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

  // Guardar sesión para social logins (cuando hay account pero no activeWallet)
  useEffect(() => {
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

  // Rehidratación automática con debouncing y mejor manejo de sesiones
  useEffect(() => {
    if (isBootstrapped && !isLogoutInProgress && session && session.shouldReconnect && !account?.address && !isConnecting) {
      // Ahora permitimos reconexión automática para wallets sociales usando sesión del servidor
      const isOriginallySocial = session.isSocial ?? false;

      if (isOriginallySocial || session.isSocial) {
        // Para social logins, intentar reconectar usando sesión del servidor
        console.log("🔄 Intentando reconectar social login usando sesión del servidor");

        // Verificar si hay sesión válida en el servidor
        void fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': session.address,
          }
        })
          .then(async (response) => {
            if (response.ok) {
              const sessionData = await response.json() as { address?: string; hasSession?: boolean };
              if (sessionData.hasSession && sessionData.address && sessionData.address === session.address) {
                console.log("✅ Sesión social válida encontrada en servidor");

                // Reconectar usando el mismo tipo de wallet
                void connect(async () => {
                  const personalWallet = createWallet(session.walletType);
                  const personalAccount = await personalWallet.connect({ client });

                  const wallet = smartWallet(accountAbstractionConfig);
                  await wallet.connect({
                    client,
                    personalAccount,
                  });
                  return wallet;
                }).catch((err) => {
                  console.warn("⚠️ Error reconectando social login:", err);
                  // Marcar como no reconectar después de error
                  const correctedSession = { ...session, shouldReconnect: false };
                  localStorage.setItem("wallet-session", JSON.stringify(correctedSession));
                  setSession(correctedSession);
                });
              } else {
                console.log("❌ No hay sesión social válida en servidor");
                // Marcar como no reconectar
                const correctedSession = { ...session, shouldReconnect: false };
                localStorage.setItem("wallet-session", JSON.stringify(correctedSession));
                setSession(correctedSession);
              }
            } else {
              console.log("❌ No hay sesión social válida en servidor");
              // Marcar como no reconectar
              const correctedSession = { ...session, shouldReconnect: false };
              localStorage.setItem("wallet-session", JSON.stringify(correctedSession));
              setSession(correctedSession);
            }
          })
          .catch((err) => {
            console.warn("⚠️ Error verificando sesión social en servidor:", err);
            // Marcar como no reconectar después de error
            const correctedSession = { ...session, shouldReconnect: false };
            localStorage.setItem("wallet-session", JSON.stringify(correctedSession));
            setSession(correctedSession);
          });

        return;
      }
      // Evitar reconexiones simultáneas con debouncing (5 segundos mínimo entre intentos)
      const now = Date.now();
      if (lastReconnectAttempt && now - lastReconnectAttempt < 5000) {
        return;
      }

      setLastReconnectAttempt(now);
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log("🔄 Verificando wallet para rehidratación:", session.walletType);
      }

      // Solo intentar reconectar wallets injected (no social wallets marcadas como isSocial)
      if (session.isSocial) {
        // Estas sesiones sociales ya se manejan en la sección anterior
        return;
      }

      // Solo reconectar wallets reales (MetaMask, etc.)
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ Intentando reconectar wallet injected:", session.walletType);
      }

      // ⚠️ Manual reconnection disabled in favor of AutoConnect (Global Smart Wallets)
      // AutoConnect in providers.tsx now handles the Account Abstraction wrapping automatically.
      if (process.env.NODE_ENV === 'development') {
        console.log("ℹ️ Skipping manual injected reconnection - relying on AutoConnect");
      }
    }
  }, [isBootstrapped, session, account?.address, isConnecting, connect, lastReconnectAttempt, isLogoutInProgress]);



  // Logout - Limpia completamente la sesión
  const logout = useCallback(() => {
    console.log("🚪 Cerrando sesión de wallet");
    setIsLogoutInProgress(true);

    try {
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
