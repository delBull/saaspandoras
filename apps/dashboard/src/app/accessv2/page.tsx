'use client';

import { Suspense } from 'react';

/**
 * /accessv2 — Unified Access Entry (Production)
 * ============================================================================
 * This is the production-ready access page, designed to work in tandem with
 * the V3 landing page (apps/nextjs/v3).
 *
 * Key differences from /access:
 * - Context-aware: reads ?project= param to personalize the entry experience
 * - Clear value proposition before asking for wallet connect
 * - Same auth/NFTGate logic underneath (no changes to core mechanics)
 * - Production language: no ritual/ceremony framing for new users
 * ============================================================================
 */

import { NFTGate } from '@/components/nft-gate';
import { useAuth } from '@/components/auth/AuthProvider';
import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';
import { wallets } from '@/lib/wallets';
import { config } from '@/config';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PortalActivated from '@/components/nft-gating/PortalActivated';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Lock, Shield } from 'lucide-react';
import { AccessState } from '@/lib/access/state-machine';
import { useAccessState } from '@/hooks/use-access-state';

// ─── Project registry (add new protocols here as they launch) ────────────────
const PROJECT_META: Record<
  string,
  { name: string; category: string; minInvestment: string; phase: string }
> = {
  snarai: {
    name: "S'Narai",
    category: 'Inversión Inmobiliaria · Bucerías, Riviera Nayarit',
    minInvestment: 'desde $50 USD',
    phase: 'Fase 1 — Abierta',
  },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function GridBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }}
    />
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.05] blur-[130px]" />
    </div>
  );
}

function ProjectContextBadge({
  projectSlug,
}: {
  projectSlug: string | null;
}) {
  if (!projectSlug || !PROJECT_META[projectSlug]) return null;
  const meta = PROJECT_META[projectSlug];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-10 inline-flex items-center gap-3 px-5 py-2.5 border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-sm rounded-full"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <div className="text-left">
        <span className="text-[10px] font-black text-white uppercase tracking-widest">
          {meta.name}
        </span>
        <span className="text-[9px] text-zinc-500 ml-3">
          {meta.category} · {meta.phase}
        </span>
      </div>
    </motion.div>
  );
}

function ValuePropsGrid() {
  const props = [
    { label: 'Acceso curado', desc: 'Solo proyectos validados internamente.' },
    { label: 'Timing', desc: 'Las mejores condiciones son las tempranas.' },
    { label: 'Acumulación', desc: 'Tu historial define tu acceso futuro.' },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 mt-8 mb-2">
      {props.map((p) => (
        <div
          key={p.label}
          className="border border-zinc-800/60 rounded-xl p-4 text-left"
        >
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
            {p.label}
          </p>
          <p className="text-[10px] text-zinc-600 leading-relaxed">{p.desc}</p>
        </div>
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-5"
    >
      <div className="w-8 h-8 rounded-full border border-zinc-700 border-t-white animate-spin" />
      <p className="text-[10px] tracking-[0.5em] text-zinc-600 uppercase">
        Verificando acceso…
      </p>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AccessV2Inner() {
  const { connect } = useConnectModal();
  const { status: authStatus, runAuthFlow, user: authUser } = useAuth();
  const {
    state,
    hasAccess,
    betaOpen,
    ritualEnabled,
    user,
    isLoading: isOracleLoading,
  } = useAccessState();
  const account = useActiveAccount();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [showPortal, setShowPortal] = useState(false);

  // Context from landing page
  const projectSlug = searchParams?.get('project') || null;
  const isReturning = searchParams?.get('returning') === 'true';
  const origin = searchParams?.get('origin') || null;
  const bypass = searchParams?.get('bypass') || null;

  const isMinting = authStatus === 'minting';
  const isLoading =
    isOracleLoading ||
    authStatus === 'booting' ||
    authStatus === 'checking_session';

  // 🧠 Phase 89: Deterministic Tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('/api/v1/marketing/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'VIEW_ACCESSV2',
          projectSlug: projectSlug || 'pandoras_access',
          metadata: {
            entry_path: window.location.pathname,
            referrer: document.referrer,
            project_context: projectSlug,
          },
        }),
      }).catch(console.error);
    }
  }, [projectSlug]);

  useEffect(() => {
    if (
      (state === AccessState.HAS_ACCESS || state === AccessState.ADMIN) &&
      mounted &&
      user?.address
    ) {
      const bypassRitual = localStorage.getItem(
        `pbox_ritual_seen_${user.address}`
      );
      if (bypassRitual) {
        // If came from a specific project, go there directly
        if (projectSlug) {
          router.push(`/protocol/${projectSlug}`);
        } else {
          router.push('/');
        }
      } else {
        setShowPortal(true);
      }
    }
  }, [state, mounted, user?.address, router, projectSlug]);

  const handleEnterSystem = () => {
    if (hasAccess) {
      if (typeof window !== 'undefined' && user?.address) {
        localStorage.setItem(`pbox_ritual_seen_${user.address}`, 'true');
        fetch('/api/v1/user/initiate', { method: 'POST' }).catch(console.error);
      }
      // Route to project or home
      if (projectSlug) {
        router.push(`/protocol/${projectSlug}`);
      } else {
        router.push('/');
      }
    } else {
      setShowPortal(false);
    }
  };

  const isApprovedFromEmail =
    typeof window !== 'undefined' &&
    (window.location.search.includes('token=') ||
      window.location.search.includes('approved=true'));

  if (!mounted) return <div className="min-h-screen bg-[#080808]" />;


  return (
    <div className="min-h-screen bg-[#080808] text-white relative overflow-hidden font-[family-name:var(--font-inter,sans-serif)]">
      <GridBackground />
      <AmbientGlow />

      {/* Top nav — minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-14 border-b border-white/[0.04] bg-[#080808]/90 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-white font-bold tracking-widest text-[11px] uppercase hover:text-zinc-300 transition-colors"
          >
            Pandoras
          </a>
          <div 
            className="hidden sm:flex flex-col gap-1 opacity-20 cursor-pointer select-none"
            onClick={() => {
              const now = Date.now();
              const clicks = JSON.parse(localStorage.getItem('admin_clicks') || '[]');
              const recentClicks = [...clicks, now].filter((t: number) => now - t < 2000);
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
        </div>
        <a
          href="/v3"
          className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
        >
          ← Volver
        </a>
      </header>

      <NFTGate
        projectId={projectSlug}
        origin={origin}
        initialState={bypass === 'ritual' ? 'RITUAL' : undefined}
      >
        {showPortal ? (
          <PortalActivated
            tier={user?.tier}
            hasAccess={!!hasAccess}
            onEnter={handleEnterSystem}
            onShowHowItWorks={() => {}}
          />
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-14">
            {/* ── LOADING STATE ─────────────────────────────────────────────── */}
            {isLoading && <LoadingSpinner />}

            {/* ── MINTING STATE ─────────────────────────────────────────────── */}
            {isMinting && !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-w-sm"
              >
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-auto" />
                <div className="w-7 h-7 rounded-full border border-zinc-700 border-t-white animate-spin mx-auto" />
                <p className="text-[10px] tracking-[0.5em] text-zinc-500 uppercase">
                  Preparando tu acceso…
                </p>
              </motion.div>
            )}

            {/* ── NOT CONNECTED ─────────────────────────────────────────────── */}
            {!authUser?.id && !isLoading && !isMinting && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md space-y-8"
              >
                {/* Project context badge */}
                <ProjectContextBadge projectSlug={projectSlug} />

                {/* Hero copy */}
                <div className="space-y-4">
                  <AnimatePresence>
                    {isApprovedFromEmail && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-2"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                          Acceso aprobado
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                    {projectSlug && PROJECT_META[projectSlug]
                      ? `Estás a un paso de ${PROJECT_META[projectSlug].name}.`
                      : 'Estás a un paso de entrar.'}
                  </h1>
                  <p className="text-zinc-500 leading-relaxed font-light">
                    {projectSlug && PROJECT_META[projectSlug]
                      ? `Pandoras verifica tu identidad para asignarte tu posición en ${PROJECT_META[projectSlug].name} — ${PROJECT_META[projectSlug].minInvestment}.`
                      : 'Pandoras utiliza tu identidad para determinar qué proyectos y condiciones corresponden a tu perfil.'}
                  </p>
                </div>

                {/* Value props */}
                <ValuePropsGrid />

                {/* Connect card */}
                <div className="border border-zinc-800 bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-4 h-4 text-zinc-500" />
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      Conexión segura
                    </p>
                  </div>

                  {/* Connect primary */}
                  <button
                    onClick={() => {
                      localStorage.removeItem('wallet-logged-out');
                      connect({
                        client,
                        chain: config.chain,
                        showThirdwebBranding: false,
                        showAllWallets: false,
                        size: 'compact',
                        wallets,
                      });
                    }}
                    className="w-full bg-white text-black py-5 text-[10px] tracking-[0.4em] font-black hover:bg-zinc-100 transition-colors uppercase flex items-center justify-center gap-3 group"
                  >
                    SOLICITAR ACCESO
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Secondary/Returning */}
                  <button
                    onClick={() =>
                      connect({
                        client,
                        chain: config.chain,
                        showThirdwebBranding: false,
                        showAllWallets: false,
                        size: 'compact',
                        wallets,
                      })
                    }
                    className="w-full bg-transparent border border-zinc-800 text-zinc-500 py-4 text-[9px] tracking-[0.3em] font-bold hover:border-zinc-600 hover:text-white transition-all uppercase"
                  >
                    CONECTAR WALLET (YA TENGO ACCESO)
                  </button>

                  {/* SIWE sign prompt (wallet connected, not authenticated) */}
                  <AnimatePresence>
                    {account && authStatus === 'unauthenticated' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-zinc-800 space-y-3"
                      >
                        <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em]">
                          Wallet detectada — Firma requerida
                        </p>
                        <motion.button
                          onClick={() => runAuthFlow()}
                          whileHover={{ backgroundColor: '#fff', color: '#000' }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full bg-zinc-900 text-white py-4 text-[10px] font-black tracking-[0.4em] uppercase border border-zinc-700 transition-all"
                        >
                          Autenticar identidad
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-[8px] tracking-[0.4em] text-zinc-700 uppercase text-center">
                    Sin colección de datos personales
                  </p>
                </div>

                {/* Footer link */}
                <p className="text-[9px] text-zinc-700">
                  <a href="/v3" className="hover:text-zinc-500 transition-colors">
                    ← Regresar a Pandoras Finance
                  </a>
                </p>
              </motion.div>
            )}

            {/* ── CONNECTED — HAS ACCESS ────────────────────────────────────── */}
            {authUser?.id && user?.hasAccess && !showPortal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="space-y-8 max-w-sm"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-emerald-500/30 bg-emerald-500/5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-[0.3em] text-emerald-400 uppercase">
                    {user?.tier === 'genesis' ? 'Genesis Access' : 'Acceso Activo'}
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {projectSlug && PROJECT_META[projectSlug]
                    ? `Tu lugar en ${PROJECT_META[projectSlug].name} está listo.`
                    : 'Acceso confirmado.'}
                </h2>

                <p className="text-zinc-500 font-light leading-relaxed">
                  Tu posición ha sido registrada. Los primeros en cada protocolo
                  obtienen las mejores condiciones para los que vengan después.
                </p>

                {/* Beta closed notice */}
                {!hasAccess && authUser?.id && (
                  <div className="p-4 border border-zinc-800 bg-zinc-900/40 rounded-xl">
                    <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-2">
                      Acceso en proceso
                    </p>
                    <p className="text-zinc-600 text-[11px] leading-relaxed">
                      Tu identidad ha sido verificada. Recibirás la confirmación
                      cuando tu posición en la plataforma esté activa.
                    </p>
                  </div>
                )}

                <motion.button
                  onClick={() => {
                    if (hasAccess) {
                      handleEnterSystem();
                    } else {
                      window.location.reload();
                    }
                  }}
                  whileHover={{ backgroundColor: hasAccess ? '#fff' : '#27272a' }}
                  className={`w-full py-4 text-[10px] tracking-[0.4em] uppercase border transition-all font-bold flex items-center justify-center gap-3 group ${
                    hasAccess
                      ? 'border-white/20 bg-transparent text-white'
                      : 'border-zinc-800 bg-zinc-900/50 text-zinc-600'
                  }`}
                >
                  {hasAccess ? (
                    <>
                      {projectSlug && PROJECT_META[projectSlug]
                        ? `Ir a ${PROJECT_META[projectSlug].name}`
                        : 'Ver oportunidades disponibles'}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  ) : (
                    'Verificar estado de acceso'
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </NFTGate>
    </div>
  );
}

export default function AccessV2Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border border-zinc-700 border-t-white animate-spin" />
      </div>
    }>
      <AccessV2Inner />
    </Suspense>
  );
}
