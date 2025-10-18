"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePersistedAccount } from "@/hooks/usePersistedAccount";

interface AutoLoginGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  serverSession?: { address?: string; hasSession: boolean } | null;
}

export function AutoLoginGate({ children, fallback, serverSession }: AutoLoginGateProps) {
  const { account, canAutoReconnect, isBootstrapped } = usePersistedAccount();
  const router = useRouter();

  // 🟢 Espera a que se termine bootstrap antes de decidir
  if (!isBootstrapped) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <div className="text-center">
          <p>Inicializando sesión...</p>
          <p className="text-xs mt-2">Cargando datos</p>
        </div>
      </div>
    );
  }

  // ✅ Caso 1: ya hay sesión activa EN THIRDWEB
  if (account?.address) {
    return <>{children}</>;
  }

  // ✅ Caso 2: hay sesión válida en servidor (dashboard) → PERMITIR ACCESO
  if (serverSession?.hasSession) {
    return <>{children}</>;
  }

  // ⏳ Caso 3: hay wallet guardada → intentando reconectar thirdweb
  if (canAutoReconnect) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <div className="text-center">
          <p>Reconectando tu sesión...</p>
          <p className="text-xs mt-2">Restaurando wallet anterior</p>
        </div>
      </div>
    );
  }

  // ❌ Caso 4: fallback personalizado
  if (fallback) {
    return <>{fallback}</>;
  }

  // ❌ Final: nada, intentar verificar sesión en servidor antes de redirigir
  // Esto es útil cuando se viene de una redirección y la sesión podría no estar sincronizada
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
