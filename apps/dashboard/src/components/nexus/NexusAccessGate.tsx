import React from 'react';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface NexusAccessGateProps {
  reason?: string;
}

export function NexusAccessGate({ reason }: NexusAccessGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Acceso Denegado</h2>
      <p className="text-zinc-400 max-w-md mb-8 leading-relaxed">
        {reason || 'No tienes los permisos necesarios para acceder a esta área de Nexus.'}
      </p>
      <div className="flex gap-4">
        <Link 
          href="/portal"
          className="px-6 py-2.5 rounded-lg font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
        >
          Volver al Portal
        </Link>
      </div>
    </div>
  );
}
