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
import { X, Fingerprint, Box, Component, Compass, ArrowRight, CheckCircle2 } from "lucide-react";
import { AccessState } from "@/lib/access/state-machine";
import { useAccessState } from "@/hooks/use-access-state";

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
      className="pointer-events-none fixed left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lime-400/20 to-transparent z-10"
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
  const { status: authStatus, runAuthFlow, user: authUser } = useAuth();
  const { state, hasAccess, betaOpen, ritualEnabled, user, isLoading: isOracleLoading } = useAccessState();
  const account = useActiveAccount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [iniciacionPhase, setIniciacionPhase] = useState(1);

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

  const isMinting = authStatus === 'minting';
  const isLoading = isOracleLoading || authStatus === 'booting' || authStatus === 'checking_session';

  useEffect(() => {
    // 🛡️ Ritual Bypass (Phase 89: Logic for returning users)
    // Only trigger portal if we are in HAS_ACCESS or ADMIN state and haven't seen the ritual locally.
    if ((state === AccessState.HAS_ACCESS || state === AccessState.ADMIN) && mounted && user?.address) {
      const bypassRitual = localStorage.getItem(`pbox_ritual_seen_${user.address}`);
      if (bypassRitual) {
        router.push("/");
      } else {
        setShowPortal(true);
      }
    }
  }, [state, mounted, user?.address, router]);

  const handleEnterSystem = () => {
    if (hasAccess) {
      // 🛡️ Phase 89: Persistent "Iniciado" Status
      if (typeof window !== 'undefined' && user?.address) {
        // Local bypass (instant)
        localStorage.setItem(`pbox_ritual_seen_${user?.address}`, 'true');
        
        // Backend persistence (non-blocking legacy sync)
        fetch('/api/v1/user/initiate', { method: 'POST' }).catch(console.error);
      }
      router.push("/");
    } else {
      // Beta closed logic
      setShowPortal(false);
    }
  };

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
        <div className="w-[300px] h-[300px] md:w-[700px] md:h-[700px] rounded-full bg-lime-500/5 blur-[80px] md:blur-[140px]" />
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
          <PortalActivated 
            tier={user?.tier} 
            hasAccess={!!hasAccess}
            onEnter={handleEnterSystem} 
            onShowHowItWorks={() => setShowHowItWorks(true)}
          />
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
                <div className="w-8 h-8 rounded-full border border-lime-500/20 border-t-lime-400 animate-spin" />
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
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-lime-400/50 to-transparent mx-auto" />
                <DynamicLoader texts={[
                  'Validando…',
                  'Generando clave…',
                  'Registrando acceso…',
                ]} />
                <div className="w-8 h-8 rounded-full border border-lime-500/10 border-t-lime-400 animate-spin mx-auto" />
                <p className="text-[9px] tracking-widest text-zinc-700 uppercase">
                  Se generará tu clave de acceso en segundo plano.
                </p>
              </motion.div>
            )}

            {/* ── ESTADO: No conectado ─────────────────────────────────────── */}
            {!authUser?.id && !isLoading && !isMinting && (
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
            {authUser?.id && user?.hasAccess && !showPortal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="space-y-8 max-w-sm"
              >
                {user?.tier === 'genesis' ? (
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
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-lime-500/30 bg-lime-500/5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.3em] text-lime-400 uppercase">Early Access</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-thin tracking-wide text-white">
                      Acceso confirmado.<br />
                      <span className="text-lime-400">
                        {isApprovedFromEmail ? "Tu clave VIP ha sido activada." : "Tu posición ha sido registrada."}
                      </span>
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

                {/* 🛡️ BETA CLOSED OVERRIDE (Phase 89 Refinement) */}
                {!hasAccess && authUser?.id && (
                  <div className="p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl">
                    <p className="text-[10px] text-orange-400 font-bold tracking-widest uppercase">
                      ⚠️ Beta Privada // Acceso en Cola
                    </p>
                    <p className="text-zinc-500 text-[11px] mt-2 leading-relaxed">
                      Tu wallet está verificada, pero el dashboard está en mantenimiento o la Beta está cerrada temporalmente. Pronto recibirás la señal para entrar.
                    </p>
                  </div>
                )}

                {/* Capital paths */}
                <div className="space-y-3">
                  <p className="text-[9px] tracking-[0.5em] text-zinc-600 uppercase mb-4">Los primeros no solo entran antes. Deciden.</p>
                  <motion.button
                    onClick={() => {
                      if (hasAccess) {
                        handleEnterSystem();
                      } else {
                        // Optimistic reload to check if admin just opened the gate
                        window.location.reload();
                      }
                    }}
                    whileHover={{ backgroundColor: hasAccess ? '#a3e635' : '#27272a', color: hasAccess ? '#000' : '#71717a' }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-4 text-[10px] tracking-[0.4em] uppercase border transition-all font-bold ${
                      hasAccess ? "border-white/20 bg-transparent text-white" : "border-zinc-800 bg-zinc-900/50 text-zinc-600"
                    }`}
                  >
                    {hasAccess ? "Ver oportunidades disponibles" : "Verificar Estado de Acceso"}
                  </motion.button>
                  <button
                    onClick={() => setShowHowItWorks(true)}
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

      {/* ── MODAL: Iniciación (Phase 89 Overhaul) ─────────────────────────── */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden relative shadow-2xl shadow-lime-500/10"
            >
              <button 
                onClick={() => {
                  setShowHowItWorks(false);
                  setIniciacionPhase(1);
                }}
                className="absolute top-8 right-8 text-zinc-700 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-10 sm:p-14 min-h-[500px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {iniciacionPhase === 1 && (
                    <motion.div
                      key="p1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <p className="text-[10px] tracking-[.8em] text-lime-500 uppercase font-black italic">Fase 1 — Reconocimiento</p>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Esto no es<br/>una cuenta</h2>
                      </div>
                      <div className="space-y-6">
                        <p className="text-zinc-400 text-sm font-light leading-relaxed">
                          Tu acceso no depende de un correo ni una contraseña.<br/>
                          <span className="text-white font-medium">Aquí, tu identidad es tu llave.</span>
                        </p>
                        <p className="text-zinc-600 text-xs italic">
                          El sistema reconoce tu presencia y decide cómo puedes entrar.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {iniciacionPhase === 2 && (
                    <motion.div
                      key="p2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <p className="text-[10px] tracking-[.8em] text-lime-500 uppercase font-black italic">Fase 2 — La Llave</p>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Tu acceso<br/>es único</h2>
                      </div>
                      <div className="space-y-6">
                        <p className="text-zinc-400 text-sm font-light leading-relaxed">
                          Tu wallet no es solo un medio de pago.<br/>
                          <span className="text-white font-medium">Es la única forma de entrar y permanecer.</span>
                        </p>
                        <p className="text-zinc-600 text-xs italic">
                          Nada se comparte. Nada se replica. Todo empieza contigo.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {iniciacionPhase === 3 && (
                    <motion.div
                      key="p3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <p className="text-[10px] tracking-[.8em] text-lime-500 uppercase font-black italic">Fase 3 — El Protocolo</p>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Esto es un<br/>protocolo</h2>
                      </div>
                      <div className="space-y-6">
                        <p className="text-zinc-400 text-sm font-light leading-relaxed">
                          No compras acceso.<br/>
                          <span className="text-white font-medium">Participas en un sistema que evoluciona.</span>
                        </p>
                        <p className="text-zinc-600 text-xs italic">
                          Cada acción cuenta. Cada decisión define tu lugar.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {iniciacionPhase === 4 && (
                    <motion.div
                      key="p4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <p className="text-[10px] tracking-[.8em] text-lime-500 uppercase font-black italic">Fase 4 — Artefactos</p>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Los artefactos<br/>definen tu nivel</h2>
                      </div>
                      <div className="space-y-6">
                        <p className="text-zinc-400 text-sm font-light leading-relaxed">
                          Al participar, obtienes piezas únicas.<br/>
                          <span className="text-white font-medium">No son objetos. Son prueba de tu avance.</span>
                        </p>
                        <div className="space-y-2 text-zinc-500 text-[11px] uppercase tracking-widest font-bold">
                          <p>— Lo que puedes hacer</p>
                          <p>— A qué puedes acceder</p>
                          <p>— Cuánto permaneces dentro</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {iniciacionPhase === 5 && (
                    <motion.div
                      key="p5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <p className="text-[10px] tracking-[.8em] text-lime-500 uppercase font-black italic">Fase 5 — Decisión</p>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Puedes<br/>entrar</h2>
                      </div>
                      <div className="space-y-6">
                        <p className="text-zinc-400 text-sm font-light leading-relaxed">
                          El sistema ya te reconoce.<br/>
                          <span className="text-white font-medium">A partir de aquí, todo queda registrado.</span>
                        </p>
                        <p className="text-zinc-600 text-xs italic">
                          Tu progreso depende de lo que hagas dentro.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-12 space-y-4">
                  {iniciacionPhase < 5 ? (
                    <button
                      onClick={() => setIniciacionPhase(prev => prev + 1)}
                      className="w-full bg-white text-black py-5 text-[10px] tracking-[0.4em] font-black hover:bg-lime-400 transition-all uppercase flex items-center justify-center gap-3 group rounded-xl"
                    >
                      {iniciacionPhase === 4 ? "Ya lo entiendo" : iniciacionPhase === 3 ? "Seguir" : iniciacionPhase === 2 ? "Entendido" : "Continuar"}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          setShowHowItWorks(false);
                          setIniciacionPhase(1);
                          if (hasAccess) handleEnterSystem();
                        }}
                        className="w-full bg-lime-500 text-black py-5 text-[10px] tracking-[0.4em] font-black hover:bg-lime-400 transition-all uppercase rounded-xl"
                      >
                        Estoy listo
                      </button>
                      <button
                        onClick={() => {
                          setShowHowItWorks(false);
                          setIniciacionPhase(1);
                        }}
                        className="w-full py-4 text-[9px] tracking-[0.3em] uppercase text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Aún no
                      </button>
                    </div>
                  )}
                  
                  {/* Progress dots */}
                  <div className="flex justify-center gap-2 pt-4">
                    {[1,2,3,4,5].map(p => (
                      <div 
                        key={p} 
                        className={`w-1 h-1 rounded-full transition-all duration-500 ${iniciacionPhase === p ? 'bg-lime-500 w-4' : 'bg-zinc-800'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
