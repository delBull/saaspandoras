'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePersistedAccount } from "@/hooks/usePersistedAccount";

interface UnauthorizedAccessProps {
  authError: string | null;
}

export function UnauthorizedAccess({ authError }: UnauthorizedAccessProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(5);

  // Countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { logout } = usePersistedAccount();

  // Redirect effect when countdown reaches 0
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/');
    }
  }, [countdown, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-zinc-900/50 border border-zinc-700/50 rounded-2xl shadow-xl max-w-md w-full backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-red-400 mb-4 flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Acceso No Autorizado
        </h1>
        <p className="text-gray-300 mb-6">
          No tienes permisos para acceder a esta sección administrativa.
          {authError && <span className="block text-orange-400 mt-2 text-sm bg-orange-900/20 p-2 rounded border border-orange-500/20">{authError}</span>}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all border border-zinc-600 font-medium group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver al Inicio
          </button>

          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-900/30 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Desconectar Wallet y Salir
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Redirigiendo automáticamente en <span className="font-mono text-lime-400">{countdown}s</span>
        </div>
      </div>
    </div>
  );
}
