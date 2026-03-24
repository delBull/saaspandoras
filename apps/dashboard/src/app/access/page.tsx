'use client';

import { NFTGate } from "@/components/nft-gate";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { Loader2, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalActivated from "@/components/nft-gating/PortalActivated";

/**
 * 🧬 Genesis Access Activation Page
 * ============================================================================
 * Final destination for waitlist users. 
 * Orchestrates Login -> Mint -> Classification -> Dashboard Entry.
 * ============================================================================
 */
export default function AccessPage() {
  const { user, state, login } = useAuth();
  const account = useActiveAccount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // 🛡️ Audit Fix: Single source of truth for verification

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🛡️ Audit Fix: Avoid blank flicker by rendering a skeleton while booting
  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  const isLoading = state === "booting" || state === "checking_session";

  // 🚀 Final Destination: Dashboard Entry
  const handleEnterSystem = () => {
    router.push("/dashboard");
  };

  const handleVerified = () => {
    if (!isVerified) {
      setIsVerified(true);
      setShowPortal(true);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <NFTGate onVerified={handleVerified}>
        {showPortal ? (
          <PortalActivated tier={user?.benefitsTier} onEnter={handleEnterSystem} />
        ) : (
          <div className="relative z-10 max-w-lg w-full text-center p-6">
            {/* Background Glow - Cyberpunk Aesthetic */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

            <h1 className="text-[10px] tracking-[0.8em] text-gray-500 mb-12 uppercase animate-pulse">
              Genesis Access Protocol // v1.0
            </h1>

            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               
               {/* 🎯 Condition 1: User has Access (Post-Mint/Classification) */}
               {user && (
                  <div className="space-y-10">
                     {user.benefitsTier === 'genesis' ? (
                        <div className="space-y-6">
                           <div className="inline-flex items-center px-4 py-1 rounded-full border border-lime-500/30 bg-lime-500/5 text-lime-400 mb-2">
                              <Zap className="w-3 h-3 mr-2" />
                              <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Status: Genesis</span>
                           </div>
                           <h2 className="text-4xl md:text-5xl font-thin tracking-[0.2em] text-white leading-tight">
                             TU ACCESO FUE <br/> <span className="text-lime-400">HABILITADO</span>
                           </h2>
                           <p className="text-gray-400 text-lg font-light tracking-wide max-w-xs mx-auto">
                             Entraste en la primera ventana. Acceso Genesis activo.
                           </p>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           <div className="inline-flex items-center px-4 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 mb-2">
                              <ShieldCheck className="w-3 h-3 mr-2" />
                              <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Status: Activado</span>
                           </div>
                           <h2 className="text-4xl md:text-5xl font-thin tracking-[0.2em] text-white leading-tight">
                             ACCESO <br/> <span className="text-blue-400">CONFIRMADO</span>
                           </h2>
                           <p className="text-gray-400 text-lg font-light tracking-wide max-w-xs mx-auto">
                             Fase pública activa. Bienvenido al ecosistema.
                           </p>
                        </div>
                     )}

                     <div className="p-10 border border-white/10 bg-zinc-950/50 backdrop-blur-xl rounded-3xl shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="relative space-y-8">
                           <p className="text-sm text-gray-400 leading-relaxed font-light">
                             Tu llave digital ha sido validada. <br/>
                             El sistema está listo para tu ingreso.
                           </p>

                           <button 
                              onClick={handleEnterSystem}
                              className="w-full bg-white text-black py-5 text-[10px] font-black tracking-[0.4em] uppercase hover:bg-lime-400 transition-all duration-500 transform hover:scale-[1.02]"
                           >
                              INGRESAR AL TERMINAL
                           </button>
                        </div>
                     </div>
                  </div>
               )}

               {/* 🎯 Condition 2: Not Authenticated Yet (Pre-Flow) */}
               {!user && !isLoading && (
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <h2 className="text-4xl font-thin tracking-widest text-white leading-tight">
                          ACCESO HABILITADO
                        </h2>
                        <p className="text-gray-400 text-lg font-light tracking-wide">
                          No es público. Está vinculado a tu identidad.
                        </p>
                     </div>

                     <div className="p-10 border border-white/5 bg-white/[0.02] backdrop-blur-sm rounded-3xl">
                        <p className="text-sm text-gray-400 mb-8 font-light italic">
                          Autentícate para activar tu ventana de acceso.
                        </p>
                        <ConnectButton 
                          client={client}
                          chain={config.chain}
                          connectButton={{
                            className: "w-full !bg-white !text-black !rounded-none !py-5 !text-[10px] !tracking-[0.4em] !font-black hover:!bg-lime-400 transition-all shadow-xl",
                            label: "IDENTIFICAR ADDRESS"
                          }}
                        />

                        {account && state === "guest" && (
                          <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-700">
                            <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-[0.2em]">Wallet Detectada // Firma Requerida</p>
                            <button 
                              onClick={() => login()}
                              className="w-full bg-lime-500 text-black py-4 text-[10px] font-black tracking-[0.4em] uppercase hover:bg-lime-400 transition-all shadow-lg"
                            >
                              FIRMAR PROTOCOLO DE ACCESO
                            </button>
                          </div>
                        )}
                     </div>
                  </div>
               )}

               <div className="space-y-4 pt-4">
                  <p className="text-[9px] tracking-[0.5em] text-gray-600 uppercase">
                    Confidencial // No Compartir Acceso
                  </p>
                  <div className="w-12 h-[1px] bg-gray-800 mx-auto" />
               </div>
            </div>
          </div>
        )}
      </NFTGate>
    </div>
  );
}
