'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  // Redirect effect when countdown reaches 0
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/');
    }
  }, [countdown, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Acceso No Autorizado</h1>
        <p className="text-gray-300 mb-6">
          No tienes permisos para acceder a esta sección administrativa.
          {authError && <span className="block text-orange-400 mt-2">Error: {authError}</span>}
        </p>
        <p className="text-sm text-gray-400 mb-4">
          Solo los usuarios administradores pueden acceder al dashboard.
        </p>
        <div className="flex items-center justify-center">
          <div className="bg-zinc-800 rounded-lg px-4 py-2 text-sm text-gray-300">
            🔄 Redirigiendo a la página principal en <span className="font-bold text-lime-400">{countdown}</span> segundos...
          </div>
        </div>
      </div>
    </div>
  );
}
