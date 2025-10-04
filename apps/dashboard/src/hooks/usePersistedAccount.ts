"use client";

import { useEffect, useCallback, useState } from "react";
import { useActiveAccount, useActiveWallet, useConnect, useDisconnect } from "thirdweb/react";
import { createWallet, type WalletId } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";

interface SavedSession {
  address: string;
  walletType: WalletId;
  shouldReconnect: boolean;
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
          // Limpiar sesiones problemáticas de wallets sociales que aún tengan shouldReconnect: true
          const isProblematicSocialWallet = (parsed.walletType.includes('inApp') || parsed.walletType.includes('inAppWallet')) && parsed.shouldReconnect;

          if (isProblematicSocialWallet) {
            console.log("🧹 Limpiando sesión problemática de wallet social:", parsed);
            const correctedSession = { ...parsed, shouldReconnect: false };
            localStorage.setItem("wallet-session", JSON.stringify(correctedSession));
            setSession(correctedSession);
          } else {
            setSession(parsed);
          }
        } catch (error) {
          console.warn("⚠️ Sesión guardada corrupta, limpiando:", error);
          localStorage.removeItem("wallet-session");
        }
      }
      setIsBootstrapped(true);
    }
  }, []);

  // Guardar sesión activa para wallets reales (MetaMask, etc.)
  useEffect(() => {
    if (account?.address && activeWallet && typeof window !== "undefined") {
      // Las wallets sociales (inApp, inAppWallet) no se reconectan automáticamente
      const isSocialWallet = activeWallet.id.includes('inApp') || activeWallet.id.includes('inAppWallet');
      const data: SavedSession = {
        address: account.address,
        walletType: activeWallet.id,
        // Solo reconectar automáticamente para wallets injected (MetaMask, etc.)
        shouldReconnect: !isSocialWallet,
      };
      localStorage.setItem("wallet-session", JSON.stringify(data));
      setSession(data);
      console.log("💾 Guardada sesión wallet real:", data);
      console.log("🔍 Wallet type analysis:", {
        walletId: activeWallet.id,
        isSocialWallet,
        shouldReconnect: !isSocialWallet
      });
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
        // Social logins nunca se reconectan automáticamente
        shouldReconnect: false,
      };

      localStorage.setItem("wallet-session", JSON.stringify(data));
      setSession(data);
      console.log("💾 Guardada sesión social login:", data);
      console.log("🚫 Social login detectado - shouldReconnect:", data.shouldReconnect);
      console.log("🔒 Social login wallet - reconnection disabled");
    }
  }, [account?.address, activeWallet]);

  // Rehidratación automática con debouncing
  useEffect(() => {
    if (isBootstrapped && !isLogoutInProgress && session && session.shouldReconnect && !account?.address && !isConnecting) {
      // Additional safety check: never reconnect if this was originally a social login
      const originalWalletType = String(session.walletType);
      const isOriginallySocial = originalWalletType.includes('inApp') ||
                                originalWalletType.includes('inAppWallet') ||
                                originalWalletType === 'email' ||
                                originalWalletType === 'google' ||
                                originalWalletType === 'apple' ||
                                originalWalletType === 'facebook' ||
                                originalWalletType.includes('social');

      if (isOriginallySocial) {
        console.log("🚫 Originally social wallet - disabling reconnection:", session.walletType);
        console.log("🔍 Original wallet type analysis:", {
          walletType: session.walletType,
          isInApp: originalWalletType.includes('inApp'),
          isInAppWallet: originalWalletType.includes('inAppWallet'),
          isEmail: originalWalletType === 'email',
          isGoogle: originalWalletType === 'google',
          isApple: originalWalletType === 'apple',
          isFacebook: originalWalletType === 'facebook',
          isSocial: originalWalletType.includes('social')
        });
        const correctedSession = { ...session, shouldReconnect: false };
        localStorage.setItem("wallet-session", JSON.stringify(correctedSession));
        setSession(correctedSession);
        return;
      }
      // Evitar reconexiones simultáneas con debouncing (5 segundos mínimo entre intentos)
      const now = Date.now();
      if (lastReconnectAttempt && now - lastReconnectAttempt < 5000) {
        console.log("⏳ Reconexión en cooldown, esperando antes del próximo intento");
        return;
      }

      setLastReconnectAttempt(now);
      console.log("🔄 Verificando wallet para rehidratación:", session.walletType);

      // Solo intentar reconectar wallets injected (no social wallets: inApp, inAppWallet, etc)
      const walletTypeStr = String(session.walletType);
      const isSocialWallet = walletTypeStr.includes('inApp') ||
                             walletTypeStr.includes('inAppWallet') ||
                             walletTypeStr === 'email' ||
                             walletTypeStr === 'google' ||
                             walletTypeStr === 'apple' ||
                             walletTypeStr === 'facebook' ||
                             walletTypeStr.includes('social'); // Add general social wallet detection

      if (isSocialWallet) {
        console.log("🚫 Wallet social detectada, saltando reconexión automática:", session.walletType);
        console.log("🔍 Social wallet detection details:", {
          walletType: session.walletType,
          isInApp: walletTypeStr.includes('inApp'),
          isInAppWallet: walletTypeStr.includes('inAppWallet'),
          isEmail: walletTypeStr === 'email',
          isGoogle: walletTypeStr === 'google',
          isApple: walletTypeStr === 'apple',
          isFacebook: walletTypeStr === 'facebook',
          isSocial: walletTypeStr.includes('social')
        });
        // Marcar como no reconectar para wallets sociales
        const correctedSession = { ...session, shouldReconnect: false };
        localStorage.setItem("wallet-session", JSON.stringify(correctedSession));
        setSession(correctedSession);
        return;
      }

      // Solo reconectar wallets reales (MetaMask, etc.)
      console.log("✅ Intentando reconectar wallet injected:", session.walletType);
      console.log("🔒 Wallet reconnection requirements check:", {
        hasSession: !!session,
        shouldReconnect: session.shouldReconnect,
        hasAccount: !!account?.address,
        isConnecting: isConnecting
      });

      void connect(async () => {
        const wallet = createWallet(session.walletType);
        await wallet.connect({ client });
        return wallet;
      }).catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        // Manejo especial para errores de MetaMask solicitud ya pendiente
        const isRequestPending = errorMessage.includes('already pending') ||
          errorMessage.includes('Request of type') ||
          (typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'number' && (err as { code: number }).code === -32002);

        if (isRequestPending) {
          console.warn("⏳ Solicitud de wallet ya está pendiente, esperando a que el usuario responda");
          // Para este error específico, NO deshabilitamos la reconexión automática
          // Simplemente esperamos que el usuario complete la solicitud existente
          setLastReconnectAttempt(Date.now() + 30000); // Bloquear reconexiones por 30 segundos
          return;
        }

        console.warn("⚠️ Error reconectando wallet injected, deshabilitando reconexión automática:", errorMessage);

        // Marcar que no se debe reconectar automáticamente después de errores graves
        if (typeof window !== "undefined") {
          const correctedSession = { ...session, shouldReconnect: false };
          localStorage.setItem("wallet-session", JSON.stringify(correctedSession));
          setSession(correctedSession);
        }
      });
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
        console.log("✅ Wallet desconectada exitosamente");
      }

      // Limpiar localStorage completamente después del disconnect
      if (typeof window !== "undefined") {
        localStorage.removeItem("wallet-session");
        setSession(null);
        console.log("🗑️ Sesión de wallet eliminada completamente");
      }

    } catch (error) {
      console.error("⚠️ Error durante logout:", error);
    } finally {
      // Reset del flag de logout inmediatamente después de la limpieza
      setTimeout(() => {
        setIsLogoutInProgress(false);
        console.log("🔄 Logout completado");
      }, 500); // Delay más corto ya que disconnect es síncrono
    }
  }, [disconnect, activeWallet]);

  return {
    account,
    logout,
    savedWalletAddress: session?.address ?? null,
    hasSavedWallet: !!session?.address,
    canAutoReconnect: !account?.address && !!session?.shouldReconnect,
    isBootstrapped, // 👈 nuevo flag para AutoLoginGate
  };
}
