"use client";

import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePersistedAccount } from "@/hooks/usePersistedAccount";
import { useEffect, useState } from "react";
import { waitForSession } from "@/lib/session";

import { useAuth } from "@/components/auth/AuthProvider";

interface AutoLoginGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  serverSession?: { address?: string; hasSession: boolean } | null;
}

export function AutoLoginGate({ children, fallback, serverSession }: AutoLoginGateProps) {
  const { account, canAutoReconnect, isBootstrapped, savedWalletAddress, isConnecting } = usePersistedAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [isClientReady, setIsClientReady] = useState(false);

  // Check explicit logout flag
  const isLoggedOut = typeof window !== 'undefined' && localStorage.getItem('wallet-logged-out') === 'true';

  // Ensure we're fully hydrated on client side
  useEffect(() => {
    setIsClientReady(true);
  }, []);

  // ❌ Redirect guests away from protected routes automatically
  // This is safely declared at the top level to obey Rules of Hooks
  const { state: authState } = useAuth();

  // ❌ Redirect guests away from protected routes automatically
  useEffect(() => {
    if (!isClientReady || authState === "booting" || authState === "authenticating" || isConnecting) return;

    if (authState === "guest" && pathname !== "/") {
      // ⏳ Patience: If we just reached guest state, give it 5 seconds to recover (e.g. if SIWE is starting)
      // This prevents the "immediate redirect" problem when auth/me resets.
      const timer = setTimeout(() => {
        console.log("[AutoLoginGate] Guest state confirmed for 5s, redirecting to Home.");
        router.push("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isClientReady, authState, isConnecting, pathname, router]);

  // 🟢 SIEMPRE permitir acceso a la Home Page ("/") para marketing/landing
  if (pathname === "/") {
    return <>{children}</>;
  }

  // 🟢 Espera a que se termine bootstrap antes de decidir
  if (!isBootstrapped || !isClientReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <div className="text-center">
          <p>Inicializando sesión...</p>
          <p className="text-xs mt-2">Cargando datos</p>
        </div>
      </div>
    );
  }

  if (isLoggedOut) {
    // If explicit logout is set, we ignore server session and force clean state
    // Ensure cookies are cleared to prevent infinite loop
    if (typeof window !== 'undefined') {
      document.cookie = "wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "thirdweb:wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }

  // 🟢 Esperar si Thirdweb está intentando conectar (evita race condition con localStorage)
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <div className="text-center">
          <p>Conectando wallet...</p>
          <p className="text-xs mt-2">Sincronizando</p>
        </div>
      </div>
    );
  }

  // ✅ Caso 1: ya hay sesión activa EN THIRDWEB
  if (account?.address) {
    // If logged out flag exists even if account exists (rare race), we might want to block, 
    // but usually UsePersistedAccount handles disconnect. 
    // If we are here, account is likely valid or reconnected manually.
    // Ensure wallet information is properly set in cookies for server-side requests
    if (typeof window !== 'undefined' && account.address) {
      document.cookie = `wallet-address=${account.address}; path=/; max-age=86400; samesite=lax`;
      // Also set in localStorage for consistency
      localStorage.setItem('wallet-address', account.address);
    }
    return <>{children}</>;
  }

  // ✅ Caso 2: hay sesión válida en servidor (dashboard) → PERMITIR ACCESO
  // BLOQUEAR SI HUBO LOGOUT EXPLÍCITO
  if (!isLoggedOut && serverSession?.hasSession && serverSession?.address) {
    // Ensure wallet information is properly set in cookies for server-side requests
    if (typeof window !== 'undefined' && serverSession.address) {
      document.cookie = `wallet-address=${serverSession.address}; path=/; max-age=86400; samesite=lax`;
      localStorage.setItem('wallet-address', serverSession.address);
    }
    return <>{children}</>;
  }

  // ✅ Caso 3: hay wallet guardada en localStorage pero no activa → intentar sincronizar
  if (!isLoggedOut && savedWalletAddress && !account?.address) {
    // Ensure wallet information is properly set in cookies for server-side requests
    if (typeof window !== 'undefined' && savedWalletAddress) {
      document.cookie = `wallet-address=${savedWalletAddress}; path=/; max-age=86400; samesite=lax`;
    }

    if (typeof window !== 'undefined') {
      // (La lógica del fetch directo en el cliente se eliminó de aquí ya que el hook superior maneja la redirección final)
      return (
        <div className="flex items-center justify-center min-h-screen text-gray-400">
          <div className="text-center">
            <p>Verificando sesión...</p>
            <p className="text-xs mt-2">Sincronizando con servidor</p>
          </div>
        </div>
      );
    }
  }

  // ⏳ Caso 4: hay wallet guardada → intentando reconectar thirdweb
  if (!isLoggedOut && canAutoReconnect) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <div className="text-center">
          <p>Reconectando tu sesión...</p>
          <p className="text-xs mt-2">Restaurando wallet anterior</p>
        </div>
      </div>
    );
  }

  // ❌ Caso 5: fallback personalizado
  if (fallback) {
    return <>{fallback}</>;
  }

  // Mientras ocurre la redirección o verificación final del hook superior, mostramos un estado de carga
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="text-center">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-4 w-48 bg-gray-700 rounded"></div>
          <div className="h-3 w-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    </div>
  );
}
