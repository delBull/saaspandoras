'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Portal Error Boundary Landing
 * /portal/error
 *
 * Cuando `resolvePortalContext` lanza un error inesperado, los layouts del
 * portal redirigen aquí (en vez de un 404). Ofrece retry + salida segura.
 */
export default function PortalErrorPage() {
  return (
    <div className="min-h-screen bg-[#040406] flex items-center justify-center font-sans">
      <div className="text-center max-w-md w-full px-6 py-10 bg-[#0C0C12] border border-white/5 rounded-2xl shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-3">Error Interno</h1>
        <p className="text-white/60 text-sm mb-8">
          Algo salió mal al cargar el espacio de trabajo. Es un error temporal de
          infraestructura, no un problema de permisos: tu sesión sigue válida.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/portal"
            className="block w-full py-3 px-4 bg-transparent border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            Volver a mi Portal Principal
          </Link>
        </div>
      </div>
    </div>
  );
}