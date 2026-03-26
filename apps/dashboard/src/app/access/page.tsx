'use client';

import { NFTGate } from "@/components/nft-gate";
import { useAuth } from "@/components/auth/AuthProvider";
import { useActiveAccount, useConnectModal } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { wallets } from "@/lib/wallets";
import { config } from "@/config";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PortalActivated from "@/components/nft-gating/PortalActivated";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🧬 /access — Ritual de Entrada
 * ============================================================================
 * Flujo:  Hero (validando) → Activación (connect) → Mint invisible → Portal
 * NFTGate maneja toda la lógica de auth + mint. Solo gestionamos UX aquí.
 * ============================================================================
 */

function Scanlines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.4) 1px, rgba(255,255,255,0.4) 2px)',
        backgroundSize: '100% 4px',
      }}
    />
  );
}

function ScanningLine() {
  return (
    <motion.div
      initial={{ top: '-2px' }}
      animate={{ top: '100%' }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
      className="pointer-events-none fixed left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent z-10"
      style={{ position: 'fixed' }}
    />
  );
}

function DynamicLoader({ texts }: { texts: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % texts.length), 1600);
    return () => clearInterval(t);
  }, [texts.length]);
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={i}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.4 }}
        className="text-[10px] tracking-[0.6em] text-zinc-500 uppercase"
      >
        {texts[i]}
      </motion.p>
    </AnimatePresence>
  );
}

export default function AccessPage() {
  const { connect } = useConnectModal();
  const { user, status, runAuthFlow } = useAuth();
  const account = useActiveAccount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    // 🧠 Phase 87: Deterministic Lead Tracking (Dogfooding)
    if (typeof window !== 'undefined') {
      fetch('/api/v1/marketing/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'VIEW_ACCESS',
          projectSlug: 'pandoras_access', // External identity for this flow
          metadata: { 
            entry_path: window.location.pathname,
            referrer: document.referrer
          }
        })
      }).catch(console.error);
    }
  }, []);

  const isLoading = status === 'booting' || status === 'checking_session';
  
  // 🛡️ Technical Fix: Ensure user object exists before checking access to avoid loops
  const isMinting = status === 'minting';

  useEffect(() => {
    if (status === "has_access" && !isVerified) {
      handleVerified();
    }
  }, [status, isVerified]);

  const handleVerified = () => {
    if (!isVerified) {
      setIsVerified(true);
      setShowPortal(true);
    }
  };

  const handleEnterSystem = () => router.push('/');

  // 📧 Email loop closure
  const isApprovedFromEmail = typeof window !== 'undefined' && 
    (window.location.search.includes('token=') || window.location.search.includes('approved=true'));

  // 🛡️ HOOK RULE FIX: Move return below all hook declarations
  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Scanlines />
      <ScanningLine />

      {/* Glow ambiental */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <div className="w-[300px] h-[300px] md:w-[700px] md:h-[700px] rounded-full bg-blue-500/6 blur-[80px] md:blur-[140px]" />
      </div>

      {/* Grid sutil */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Decoración técnica top-left - Hidden on mobile */}
      <div 
        className="absolute top-6 left-6 md:top-10 md:left-10 hidden sm:flex flex-col gap-1 opacity-20 z-10 cursor-pointer select-none"
        onClick={() => {
          const now = Date.now();
          const clicks = JSON.parse(localStorage.getItem('admin_clicks') || '[]');
          const recentClicks = [...clicks, now].filter(t => now - t < 2000);
          localStorage.setItem('admin_clicks', JSON.stringify(recentClicks));
          
          if (recentClicks.length >= 3) {
            localStorage.setItem('pandoras_bypass', 'true');
            localStorage.removeItem('admin_clicks');
            window.location.reload();
          }
        }}
      >
        <span className="text-[7px] font-mono text-zinc-600">GENESIS_ACCESS_PROTOCOL</span>
        <div className="w-8 h-[1px] bg-zinc-700" />
        <span className="text-[7px] font-mono text-zinc-700">v2.0 // RESTRICTED</span>
      </div>

      <NFTGate>
        {showPortal ? (
          <PortalActivated tier={user?.benefitsTier} onEnter={handleEnterSystem} />
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">

            {/* ── HERO: Estado de validación ──────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-16 space-y-4"
            >
              <AnimatePresence>
                {isApprovedFromEmail && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-lime-400 text-[10px] tracking-[0.4em] uppercase mb-2"
                  >
                    Tu acceso fue aprobado.
                  </motion.p>
                )}
              </AnimatePresence>
              
              <p className="text-[9px] tracking-[1em] text-zinc-600 uppercase animate-pulse">
                Acceso en proceso
              </p>
              <DynamicLoader texts={[
                'Tu acceso está siendo evaluado…',
                'No todos van a pasar…',
                'Preparando protocolo…',
              ]} />
            </motion.div>

            {/* ── ESTADO: Cargando auth ─────────────────────────────────────── */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full border border-blue-500/30 border-t-blue-400 animate-spin" />
                <p className="text-[9px] tracking-[0.5em] text-zinc-600 uppercase">Conectando sistema…</p>
              </motion.div>
            )}

            {/* ── ESTADO: Mintando (post-connect, pre-verificado) ──────────── */}
            {isMinting && !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-w-sm"
              >
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-blue-400 to-transparent mx-auto" />
                <DynamicLoader texts={[
                  'Validando…',
                  'Generando clave…',
                  'Registrando acceso…',
                ]} />
                <div className="w-8 h-8 rounded-full border border-blue-500/20 border-t-blue-400 animate-spin mx-auto" />
                <p className="text-[9px] tracking-widest text-zinc-700 uppercase">
                  Se generará tu clave de acceso en segundo plano.
                </p>
              </motion.div>
            )}

            {/* ── ESTADO: No conectado ─────────────────────────────────────── */}
            {!user?.id && !isLoading && !isMinting && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2 }}
                className="w-full max-w-sm space-y-10"
              >
                {/* Bloque principal */}
                <div className="space-y-4 px-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-thin tracking-[0.1em] md:tracking-[0.15em] text-white uppercase leading-tight">
                    Tu acceso no es<br />visible aún.
                  </h1>
                  <p className="text-zinc-500 text-base font-light leading-relaxed">
                    No es público. Está vinculado a tu identidad.
                  </p>
                </div>

                {/* Card de activación */}
                <div className="border border-zinc-800 bg-zinc-950/60 backdrop-blur-xl rounded-3xl p-8 space-y-6">
                  <p className="text-sm text-zinc-500 font-light leading-relaxed">
                    Conecta para continuar.<br />
                    <span className="text-zinc-600 text-xs">Se generará tu clave de acceso en segundo plano.</span>
                  </p>

                  <button
                    onClick={() => {
                      // We stay on this page but let NFTGate handle it? 
                      // Actually, if they are here, leadCaptured might be true.
                      // If they want to "re-apply" or if they came here directly:
                      window.location.reload(); 
                    }}
                    className="w-full bg-white text-black py-5 text-[10px] tracking-[0.4em] font-black hover:bg-lime-400 transition-all uppercase mb-4"
                  >
                    SOLICITAR ACCESO
                  </button>

                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("wallet-logged-out");
                      }
                      connect({
                        client,
                        chain: config.chain,
                        showThirdwebBranding: false,
                        showAllWallets: false,
                        size: "compact",
                        wallets,
                      });
                    }}
                    className="w-full bg-transparent border border-zinc-800 text-zinc-500 py-4 text-[9px] tracking-[0.3em] font-bold hover:border-zinc-600 hover:text-white transition-all uppercase"
                  >
                    CONECTAR WALLET (YA TENGO ACCESO)
                  </button>

                  {/* Firma SIWE si wallet conectada pero no autenticada */}
                  <AnimatePresence>
                    {account && status === 'unauthenticated' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-zinc-800 space-y-3"
                      >
                        <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em]">
                          Wallet Detectada // Firma Requerida
                        </p>
                        <motion.button
                          onClick={() => runAuthFlow()}
                          whileHover={{ backgroundColor: '#a3e635', color: '#000' }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full bg-zinc-900 text-white py-4 text-[10px] font-black tracking-[0.4em] uppercase border border-zinc-700 transition-all"
                        >
                          FIRMAR PROTOCOLO
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-[8px] tracking-[0.5em] text-zinc-700 uppercase">
                  Confidencial // No Compartir Acceso
                </p>
              </motion.div>
            )}

            {/* ── ESTADO: Usuario con acceso activo ya (no en portal aún) ── */}
            {user?.hasAccess && !showPortal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="space-y-8 max-w-sm"
              >
                {user.benefitsTier === 'genesis' ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-lime-500/30 bg-lime-500/5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.3em] text-lime-400 uppercase">Genesis Access</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-thin tracking-wide text-white">
                      Acceso confirmado.<br />
                      <span className="text-lime-400">Estás dentro antes que el resto.</span>
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-blue-500/30 bg-blue-500/5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.3em] text-blue-400 uppercase">Early Access</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-thin tracking-wide text-white">
                      Acceso confirmado.<br />
                      <span className="text-blue-400">Tu posición ha sido registrada.</span>
                    </h2>
                  </>
                )}

                <p className="text-zinc-500 text-sm font-light leading-relaxed">
                  Tu nivel de acceso define lo que puedes ver y en qué participas.
                </p>

                {/* Revelación */}
                <div className="border border-zinc-800 bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 text-left space-y-4">
                  <p className="text-xs text-zinc-600 tracking-widest uppercase">No todo es visible desde el inicio.</p>
                  <p className="text-zinc-400 text-sm font-light">Tu acceso desbloquea:</p>
                  <div className="space-y-2 text-zinc-500 text-sm">
                    <p>— Pools internos con ventajas de permanencia</p>
                    <p>— Protocolos en fase temprana</p>
                    <p>— Distribuciones no públicas</p>
                  </div>
                </div>

                {/* Capital paths */}
                <div className="space-y-3">
                  <p className="text-[9px] tracking-[0.5em] text-zinc-600 uppercase mb-4">Los primeros no solo entran antes. Deciden.</p>
                  <motion.button
                    onClick={handleEnterSystem}
                    whileHover={{ backgroundColor: '#a3e635', color: '#000' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 text-[10px] tracking-[0.4em] uppercase border border-white/20 bg-transparent text-white transition-all font-bold"
                  >
                    Ver oportunidades disponibles
                  </motion.button>
                  <button
                    onClick={handleEnterSystem}
                    className="w-full py-3 text-[9px] tracking-[0.3em] uppercase text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Entender cómo funciona
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        )}
      </NFTGate>
    </div>
  );
}
