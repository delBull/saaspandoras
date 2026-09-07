'use client';

import { useState } from 'react';
import { requestDeveloperAccessAction } from '@/app/nexus/developers/actions';
import { Terminal, Check, Loader2 } from 'lucide-react';

interface Props {
  userName: string;
  userRole: string;
}

export function RequestDeveloperDocsButton({ userName, userRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestDeveloperAccessAction(userName, userRole);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || 'Ocurrió un error');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in">
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
          <Check className="w-6 h-6" />
        </div>
        <p className="text-green-400 font-mono text-sm tracking-wider">Solicitud enviada exitosamente</p>
        <p className="text-zinc-500 text-xs max-w-sm text-center mt-2">
          Marco recibirá la notificación y podrá aprobar tu acceso directamente desde la consola Nexus.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleRequest}
        disabled={loading}
        className="group relative px-6 py-3 bg-pandoras-500/10 border border-pandoras-500/30 text-pandoras-300 rounded-xl hover:bg-pandoras-500/20 transition-all disabled:opacity-50 flex items-center gap-2 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pandoras-500/0 via-pandoras-500/10 to-pandoras-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Terminal className="w-5 h-5" />}
        <span className="font-mono tracking-wider font-semibold">
          SOLICITAR ACCESO A DEVELOPER DOCS
        </span>
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
