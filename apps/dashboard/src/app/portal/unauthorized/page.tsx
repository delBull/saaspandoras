import React, { Suspense } from 'react';
import Link from 'next/link';

function UnauthorizedContent() {
  return (
    <div className="text-center max-w-md w-full px-6 py-10 bg-[#0C0C12] border border-white/5 rounded-2xl shadow-2xl">
      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-white mb-3">Acceso Denegado</h1>
      <p className="text-white/60 text-sm mb-8">
        No tienes permisos para acceder a esta organización, o la sesión actual pertenece a otro espacio de trabajo.
      </p>
      
      <div className="space-y-3">
        <Link 
          href="/portal"
          className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Ir a mi Portal Principal
        </Link>
        <Link 
          href="/portal/login"
          className="block w-full py-3 px-4 bg-transparent border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-sm font-medium transition-colors"
        >
          Iniciar Sesión con otra cuenta
        </Link>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#040406] flex items-center justify-center font-sans">
      <Suspense fallback={<div className="text-white/50 animate-pulse">Cargando...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </div>
  );
}
