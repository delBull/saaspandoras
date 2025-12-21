"use client";

import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePersistedAccount } from "@/hooks/usePersistedAccount";
import { useEffect, useState } from "react";

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

  // Ensure we're fully hydrated on client side
  useEffect(() => {
    setIsClientReady(true);
  }, []);

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

  // Check explicit logout flag
  const isLoggedOut = typeof window !== 'undefined' && localStorage.getItem('wallet-logged-out') === 'true';

  if (isLoggedOut) {
    // If explicit logout is set, we ignore server session and force clean state
    // Ensure cookies are cleared to prevent infinite loop
    if (typeof window !== 'undefined') {
      document.cookie = "wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "thirdweb:wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    // If we are connecting (user action), let it pass?
    // No, if isConnecting is true, user might have just clicked "Connect". 
    // BUT we clear the flag on "Connect" click. So isLoggedOut should be false if connecting manually.
    // So if isLoggedOut is true, we block.

    // Fallback to home if no children should be shown
    if (pathname !== "/") {
      // Verify if we should redirect or just render children (unauthenticated)
      // Dashboard routes usually require auth.
      // But preventing loop is priority.
      // We'll let it fall through to the final redirect logic.
    }
  }

  // 🟢 Esperar si Thirdweb está intentando conectar (evita race condition con localStorage)
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
      document.cookie = `wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;
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
      document.cookie = `wallet-address=${serverSession.address}; path=/; max-age=86400; samesite=strict`;
      localStorage.setItem('wallet-address', serverSession.address);
    }
    return <>{children}</>;
  }

  // ✅ Caso 3: hay wallet guardada en localStorage pero no activa → intentar sincronizar
  if (!isLoggedOut && savedWalletAddress && !account?.address) {
    // Ensure wallet information is properly set in cookies for server-side requests
    if (typeof window !== 'undefined' && savedWalletAddress) {
      document.cookie = `wallet-address=${savedWalletAddress}; path=/; max-age=86400; samesite=strict`;
    }

    // Try to verify session with server using saved wallet
    if (typeof window !== 'undefined') {
      fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': savedWalletAddress,
          'x-wallet-address': savedWalletAddress,
          'x-user-address': savedWalletAddress,
        }
      })
        .then(response => response.json())
        .then((data: { hasSession?: boolean; address?: string }) => {
          if (data.hasSession && data.address) {
            // Session is valid, reload to sync with server
            window.location.reload();
            return;
          } else {
            // No valid session, redirect to home
            router.push("/");
          }
        })
        .catch(() => {
          router.push("/");
        });

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

  // ❌ Final: intentar verificar sesión en servidor antes de redirigir
  if (typeof window !== 'undefined') {
    // En el cliente, intentar verificar sesión antes de redirigir
    fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => response.json())
      .then((data: { hasSession?: boolean }) => {
        if (data.hasSession) {
          // Si hay sesión en servidor, recargar la página para sincronizar
          window.location.reload();
          return;
        } else {
          // Si no hay sesión, redirigir a login
          router.push("/");
        }
      })
      .catch(() => {
        // En caso de error, redirigir a login
        router.push("/");
      });
  } else {
    // En servidor, redirigir directamente
    router.push("/");
  }

  return null;
}
