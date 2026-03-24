'use client';

import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * 🏁 Waitlist Success Page
 * ============================================================================
 * Provides psychological closure after lead capture. 
 * Confirms status and sets expectations for the email sequence.
 * ============================================================================
 */
export default function WaitlistSuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-12 animate-in fade-in zoom-in duration-1000">
        
        <div className="flex justify-center">
           <div className="p-4 rounded-full bg-white/5 border border-white/10 relative overflow-hidden group">
              <CheckCircle2 className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
           </div>
        </div>

        <div className="space-y-4">
           <h1 className="text-3xl font-thin tracking-[0.3em] uppercase text-white">
             ACCESO EN <br/> EVALUACIÓN
           </h1>
           <div className="h-[1px] w-12 bg-gray-800 mx-auto" />
           <p className="text-gray-400 text-sm font-light tracking-wide leading-relaxed">
             Tu solicitud ha sido registrada en el protocolo.<br/>
             Estamos validando tu perfil y capital.
           </p>
        </div>

        <div className="p-8 border border-white/5 bg-zinc-950/30 backdrop-blur-sm rounded-2xl space-y-6">
           <p className="text-xs text-gray-500 font-light tracking-widest uppercase">
             Siguientes Pasos
           </p>
           <ul className="text-left space-y-4">
              <li className="flex items-start space-x-3">
                 <div className="w-1 h-1 bg-white rounded-full mt-2" />
                 <span className="text-sm text-gray-300 font-light">Revisa tu correo para confirmar tu identidad.</span>
              </li>
              <li className="flex items-start space-x-3">
                 <div className="w-1 h-1 bg-white rounded-full mt-2" />
                 <span className="text-sm text-gray-300 font-light">La selección se realiza en batches de 72h.</span>
              </li>
              <li className="flex items-start space-x-3">
                 <div className="w-1 h-1 bg-white rounded-full mt-2" />
                 <span className="text-sm text-gray-300 font-light">Recibirás instrucciones de activación vía e-mail.</span>
              </li>
           </ul>
        </div>

        <div className="flex items-center justify-center space-x-3 text-gray-600">
           <ShieldAlert className="w-4 h-4" />
           <p className="text-[10px] tracking-[0.3em] uppercase">
             No compartas este acceso.
           </p>
        </div>

      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20">
         <p className="text-[10px] tracking-[0.6em] uppercase">Pandora // Genesis Protocol</p>
      </div>
    </div>
  );
}
