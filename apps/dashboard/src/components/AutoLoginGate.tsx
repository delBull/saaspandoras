"use client";

import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePersistedAccount } from "@/hooks/usePersistedAccount";
import { useEffect, useState } from "react";
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
  const { status: authStatus } = useAuth();

  /* 
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
  */

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

  // ✅ ELITE FIX: Do NOT bypass the AuthProvider state machine.
  // We let AuthProvider decide if the user has access.
  // This component only serves as a visual barrier during initialization.

  return <>{children}</>;
}
