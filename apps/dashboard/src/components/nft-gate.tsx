'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useActiveAccount, useConnectModal } from "thirdweb/react";
import Image from "next/image";
import { MintingProgressModal } from "./nft-gating/minting-progress-modal";
import { SuccessNFTCard } from "./nft-gating/success-nft-card";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, AuthStatus, User } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { client } from "@/lib/thirdweb-client";
import { wallets } from "@/lib/wallets";
import { config } from "@/config";

/**
 * 🛰️ NFT GATE — PRODUCTION-HARDENED CONVERSION FUNNEL v3
 * ============================================================================
 * Hybrid Web2 + Web3 funnel with Growth OS integration.
 *
 * FLOW:
 *   1. Hero → "Solicitar Acceso"
 *   2. Lead Capture Form → POST /api/access-requests → Growth OS confirmed
 *      └─ Persist to localStorage (keyed by wallet/guest)
 *   3. Connect Wallet (if not connected)
 *   4. Iniciar Ritual → NFT mint polling → has_access → children
 *
 * HARDENING (Round 2):
 *   ✅ FIX 1: Guest→Wallet migration — no duplicate form after connecting
 *   ✅ FIX 2: Explicit `isAdmin === true` bypass — no ambiguous states
 *   ✅ FIX 3: No double mint — retry polls session, NEVER re-mints
 *   ✅ FIX 4: Backend fallback via /api/lead-exists before showing form
 *   ✅ TRACKING: lead_captured, ritual_started, ritual_success
 * ============================================================================
 */

type GateVisualState =
  | "idle" | "checking" | "minting" | "retrying"
  | "confirming_irreversible" | "finalizing" | "success" | "error";

type LeadStep = "hero" | "form" | "submitted";

// ─── Persistence Helpers ──────────────────────────────────────────────────
function getLeadKey(address?: string): string {
  return address ? `pandora_lead_${address.toLowerCase()}` : "pandora_lead_guest";
}

function trackEvent(event: string, wallet?: string, data?: Record<string, unknown>) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, wallet, data }),
  }).catch(() => { });
}

// ─── LeadCaptureGate ─────────────────────────────────────────────────────
interface LeadCaptureGateProps {
  onLeadCaptured: () => void;
  projectId?: string | null;
}

function LeadCaptureGate({ onLeadCaptured, projectId }: LeadCaptureGateProps) {
  const { connect } = useConnectModal();
  const account = useActiveAccount();

  const [step, setStep] = useState<LeadStep>("hero");
  const [formData, setFormData] = useState({ email: "", walletAddress: "", capital: "", interest: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // FIX 4: Separate flag — set only after backend confirms success
  const [leadSaved, setLeadSaved] = useState(false);

  // FIX 4: Race guard — onLeadCaptured fires only when BOTH conditions met
  useEffect(() => {
    if (leadSaved && account) {
      onLeadCaptured();
    }
  }, [account, leadSaved, onLeadCaptured]);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) { setError("El email es requerido."); return; }
    setLoading(true);
    setError("");

    try {
      // FIX 5: Pre-check to prevent duplicate registrations in the frontend
      const checkRes = await fetch(`/api/lead-exists?email=${encodeURIComponent(formData.email)}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setError("Este correo ya ha sido registrado previamente. Por favor, conecta tu wallet si ya tienes acceso.");
          setLoading(false);
          return;
        }
      }

      // FIX 3: Validate backend — no ghost leads
      const res = await fetch("/api/v1/marketing/leads/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-internal-service": "pandoras-v2"
        },
        body: JSON.stringify({
          email: formData.email,
          walletAddress: formData.walletAddress || account?.address || null,
          intent: formData.interest || "explore",
          projectId: projectId || "pandoras_access",
          metadata: { 
            capital: formData.capital,
            interest: formData.interest 
          },
          consent: true,
          origin: "nft_gate_dashboard",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || "No se pudo registrar el lead. Intenta de nuevo.");
      }

      // Persist — keyed by wallet if known, else guest (will be migrated on connect)
      const key = getLeadKey(account?.address);
      localStorage.setItem(key, "true");
      // Store email for identity linking bridge
      localStorage.setItem("pandora_lead_email", formData.email);

      trackEvent("lead_captured", account?.address, {
        email: formData.email,
        capital: formData.capital,
        interest: formData.interest,
      });

      // Mark saved AFTER backend confirms — guards race condition
      setLeadSaved(true);
      setStep("submitted");
    } catch (err: any) {
      setError(err.message || "Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () =>
    connect({ client, chain: config.chain, showThirdwebBranding: false, showAllWallets: false, size: "compact", wallets });

  if (step === "hero") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center">
        <div className="w-24 h-24 mb-10 relative">
          <Image src="/images/pkey.png" alt="Key" width={120} height={120} className="relative z-10 animate-float" />
          <div className="absolute inset-0 bg-lime-500/20 blur-3xl rounded-full animate-pulse" />
        </div>
        <p className="text-[9px] tracking-[1em] text-zinc-600 uppercase mb-4 animate-pulse">Protocolo Pandora's</p>
        <h2 className="text-4xl font-thin tracking-[0.12em] uppercase text-white mb-4 max-w-xs leading-tight">
          El acceso no es<br />para todos.
        </h2>
        <p className="text-zinc-500 text-sm font-light leading-relaxed mb-12 max-w-xs">
          Está siendo habilitado selectivamente.<br />
          <span className="text-zinc-600 text-xs">Tu perfil determina si entras.</span>
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setStep("form")}
            className="w-full bg-white text-black py-5 font-black uppercase text-[11px] tracking-[0.4em] hover:bg-lime-400 transition-all duration-500"
          >
            Solicitar Acceso
          </button>
          
          <button
            onClick={handleConnect}
            className="w-full bg-transparent border border-zinc-800 text-zinc-500 py-4 font-bold uppercase text-[9px] tracking-[0.3em] hover:border-zinc-600 hover:text-white transition-all duration-300"
          >
            Ya tengo acceso (Conectar)
          </button>
        </div>

        <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-800 font-bold mt-8">
          No todos los accesos son aprobados.
        </p>
        {/* Hidden admin bypass: triple-click */}
        <p
          className="text-[7px] font-mono text-zinc-800 mt-16 cursor-pointer select-none"
          onClick={() => {
            const now = Date.now();
            const clicks = JSON.parse(localStorage.getItem("admin_clicks") || "[]") as number[];
            const recent = [...clicks, now].filter(t => now - t < 2000);
            localStorage.setItem("admin_clicks", JSON.stringify(recent));
            if (recent.length >= 3) {
              localStorage.setItem("pandoras_bypass", "true");
              localStorage.removeItem("admin_clicks");
              window.location.reload();
            }
          }}
        >
          GENESIS_ACCESS_PROTOCOL v2.0 // RESTRICTED
        </p>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6 py-24 relative">
        <button
          onClick={() => setStep("hero")}
          className="absolute top-8 left-8 text-[8px] tracking-[0.5em] text-zinc-700 hover:text-zinc-400 uppercase transition-colors"
        >
          ← Volver
        </button>
        <div className="w-full max-w-md">
          <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase mb-6 text-center">Identificación de Perfil</p>
          <h1 className="text-4xl font-thin tracking-wide text-center mb-2">Tu perfil determina<br />si entras.</h1>
          <p className="text-zinc-600 text-xs text-center mb-12 tracking-wider">No todos recibirán acceso.</p>

          <form onSubmit={handleSubmitLead} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase">Email *</label>
              <input
                type="email" required value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase">Wallet Address <span className="text-zinc-700">(opcional)</span></label>
              <input
                type="text" value={formData.walletAddress}
                onChange={e => setFormData({ ...formData, walletAddress: e.target.value })}
                placeholder="0x..."
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase">Capital estimado <span className="text-zinc-700">(opcional)</span></label>
              <select
                value={formData.capital} onChange={e => setFormData({ ...formData, capital: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-zinc-600 text-zinc-400 transition-colors appearance-none"
              >
                <option value="">Selecciona una opción</option>
                <option value="5k-25k">$5k – $25k</option>
                <option value="25k-100k">$25k – $100k</option>
                <option value="100k+">$100k+</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase">¿Por qué quieres entrar? <span className="text-zinc-700">(opcional)</span></label>
              <select
                value={formData.interest} onChange={e => setFormData({ ...formData, interest: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-zinc-600 text-zinc-400 transition-colors appearance-none"
              >
                <option value="">Selecciona una opción</option>
                <option value="capital">Quiero asignar capital</option>
                <option value="deals">Quiero acceder a deals privados</option>
                <option value="genesis">Quiero ser Genesis</option>
                <option value="build">Quiero construir dentro del sistema</option>
                <option value="explore">Solo quiero explorar</option>
              </select>
            </div>

            {error && <p className="text-red-500/80 text-[10px] tracking-wider">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full mt-4 py-4 text-[10px] tracking-[0.5em] uppercase border border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-all duration-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Evaluando acceso..." : "Solicitar Acceso Anticipado"}
            </button>
            <p className="text-[7px] tracking-[0.3em] text-zinc-700 text-center mt-4 leading-loose">
              Al continuar aceptas nuestros Términos y Política de Privacidad.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Step: submitted — connect wallet
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center">
      <div className="w-px h-16 bg-gradient-to-b from-transparent via-lime-400 to-transparent mx-auto mb-8" />
      <p className="text-[9px] tracking-[0.7em] text-lime-500 uppercase mb-6">Solicitud registrada</p>
      <h2 className="text-3xl font-thin tracking-wide mb-4">Tu perfil está en revisión.</h2>
      <p className="text-zinc-500 text-sm leading-loose font-light mb-10 max-w-sm">
        Para continuar y reclamar tu acceso Genesis,<br />conecta tu wallet.
      </p>
      <button
        onClick={handleConnect}
        className="bg-white text-black px-12 py-5 rounded-full font-black uppercase text-[11px] tracking-[0.3em] hover:bg-lime-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
      >
        Conectar Wallet
      </button>
      <p className="text-[10px] text-zinc-600 mt-4 uppercase tracking-widest font-black">
        Requerido para reclamar NFT de acceso
      </p>
    </div>
  );
}

// ─── Main NFTGate ─────────────────────────────────────────────────────────
interface NFTGateProps {
  children: React.ReactNode;
  status?: AuthStatus; // Use strict type
  user?: User | null; // Use strict type
  initialState?: "HERO" | "FORM" | "RITUAL"; 
  projectId?: string | null;
  origin?: string | null;
  context?: {
    hasWallet: boolean;
    status: AuthStatus;
  };
}

export function NFTGate({ 
  children, 
  status: externalStatus, 
  user: externalUser,
  initialState,
  projectId,
  origin,
  context 
}: NFTGateProps) {
  const [visualState, setVisualState] = useState<GateVisualState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // ELITE: If initialState is RITUAL, we assume lead is already captured/verified
  const [leadCaptured, setLeadCaptured] = useState(initialState === "RITUAL");
  const [leadHydrated, setLeadHydrated] = useState(initialState === "RITUAL");

  // Hooks (Internal state if no props provided)
  const internalAccount = useActiveAccount();
  const { connect } = useConnectModal();
  const { user: internalUser, status: internalStatus, triggerMint, refreshSession } = useAuth();
  const { isAdmin } = useAdmin();

  // Use external context if available, else fallback to hooks
  const status = context?.status || externalStatus || internalStatus;
  const user = externalUser || internalUser;
  const account = internalAccount; // Wallet identity always comes from hook
  const router = useRouter();
  const { toast } = useToast();
  const ritualRunning = useRef(false);

  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

  // FIX 1 + FIX 4: Hydrate leadCaptured from localStorage, keyed by wallet.
  // Also migrate guest key → wallet key when account connects.
  // Also check backend as fallback for cross-device/incognito scenarios.
  useEffect(() => {
    const walletKey = getLeadKey(account?.address);
    const guestKey = "pandora_lead_guest";

    // FIX 1: Migrate guest storage → wallet storage
    const guestLead = localStorage.getItem(guestKey);
    if (guestLead === "true" && account?.address) {
      localStorage.setItem(walletKey, "true");
      localStorage.removeItem(guestKey);
      setLeadCaptured(true);
      setLeadHydrated(true);
      return;
    }

    // Normal hydration from localStorage
    if (localStorage.getItem(walletKey) === "true") {
      setLeadCaptured(true);
      setLeadHydrated(true);
      return;
    }

    // FIX 4: Backend fallback — cross-device / incognito
    if (account?.address) {
      fetch(`/api/lead-exists?wallet=${account.address}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: { exists?: boolean } | null) => {
          if (data?.exists) {
            localStorage.setItem(walletKey, "true");
            setLeadCaptured(true);
          }
        })
        .catch(() => {
          // MICRO EDGE 2 (optimistic): Backend failed + wallet present → let them through
          // Background revalidation after 5s — recovers eventual consistency
          setLeadCaptured(true);
          const addr = account?.address;
          if (addr) {
            setTimeout(() => {
              fetch(`/api/lead-exists?wallet=${addr}`)
                .then(r => r.ok ? r.json() : null)
                .then((d: { exists?: boolean } | null) => {
                  // If not a real lead: clear optimistic state so next visit shows form
                  if (d && !d.exists) {
                    localStorage.removeItem(getLeadKey(addr));
                  }
                })
                .catch(() => { /* silent — already passed */ });
            }, 5000);
          }
        })
        .finally(() => setLeadHydrated(true));
    } else {
      setLeadHydrated(true);
    }
  }, [account?.address]);

  // FIX 1+4: When wallet connects, fire wallet_connected tracking AND identity link bridge
  useEffect(() => {
    if (account?.address) {
      trackEvent("wallet_connected", account.address);

      // Identity Linking Bridge — bridges email + wallet in Growth OS
      const email = localStorage.getItem("pandora_lead_email");
      const linkKey = `pandora_link_${account.address.toLowerCase()}`;
      
      if (email && localStorage.getItem(linkKey) !== "true") {
        fetch("/api/link-identity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, walletAddress: account.address }),
        }).then(r => {
          if (r.ok) localStorage.setItem(linkKey, "true");
        }).catch(() => {});
      }
    }
  }, [account?.address]);

  const handleLeadCaptured = useCallback(() => {
    const key = getLeadKey(account?.address);
    localStorage.setItem(key, "true");
    setLeadCaptured(true);
  }, [account?.address]);

  // 🚀 RITUAL FLOW
  const runRitual = async () => {
    // MICRO EDGE 2: sessionStorage lock — survives remounts, hot-reload, navigation glitches
    if (sessionStorage.getItem("ritual_lock") === "true") return;
    if (ritualRunning.current) return;
    if (visualState !== "idle" && visualState !== "error") return;
    if (!account) {
      connect({ client, chain: config.chain, showThirdwebBranding: false, showAllWallets: false, size: "compact", wallets });
      return;
    }

    sessionStorage.setItem("ritual_lock", "true");
    ritualRunning.current = true;
    try {
      trackEvent("ritual_started", account.address);
      setVisualState("checking");

      // Trigger mint ONCE — never call again
      const mintPromise = triggerMint();

      await wait(1800);
      setVisualState("minting");
      await wait(2000);

      // MICRO-OPT: True randomness — deterministic seed created recognizable UX patterns
      if (Math.random() < 0.25) {
        setVisualState("retrying");
        await wait(3000);
      }

      setVisualState("confirming_irreversible");
      await wait(1500);
      setVisualState("finalizing");

      await mintPromise;

      // EDGE CASE 1: Single source of truth — only trust fresh refreshSession()
      // Avoids false positives from stale `status` or `user` closure values
      let finalHasAccess = false;
      for (let i = 0; i < 8; i++) {
        await wait(1500);
        const session = await refreshSession();
        if (session?.user?.hasAccess) {
          finalHasAccess = true;
          break;
        }
      }

      if (finalHasAccess) {
        trackEvent("ritual_success", account.address);
        sessionStorage.removeItem("ritual_lock"); // release lock on success
        setVisualState("success");
        setShowSuccessAnimation(true);
        toast({ title: "Acceso Concedido", description: "Identidad Genesis sincronizada." });

        // Phase: External Widget Communication & Registration
        if (projectId && projectId !== 'pandoras' && projectId !== 'dashboard') {
          try {
            fetch("/api/v1/external-commerce/ensure-pandora-key", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wallet: account.address, projectId })
            }).catch(console.error);
          } catch (e) {
            console.error("Failed to ensure pandoras key", e);
          }
        }

        // Send postMessage to opener to refresh the widget
        if (typeof window !== 'undefined' && window.opener) {
           window.opener.postMessage("growth_os:auth_success", origin || "*");
        }
      } else {
        throw new Error("No se detectó el NFT en esta wallet. Si acabas de mintear, espera unos segundos y reintenta.");
      }

    } catch (err: any) {
      console.error("[NFTGate] Ritual interrupted:", err);
      sessionStorage.removeItem("ritual_lock"); // release lock on error so user can retry
      setErrorMessage(err.message || "Interrupción de señal.");
      setVisualState("error");
    } finally {
      ritualRunning.current = false;
    }
  };

  const isAuthLoading = ["booting", "checking_session", "checking_access"].includes(status);

  // FIX 2: Explicit === true — eliminates undefined/null ambiguity
  const hasAccess = status === "has_access";
  const isVerifiedAdmin = isAdmin === true && !!account;
  const shouldBypass = hasAccess || isVerifiedAdmin;

  // 🟢 CASE 1: Full Access (Bypass everything except wallet requirement)
  if (shouldBypass) {
    const hasSeenSuccess = typeof window !== 'undefined' ? sessionStorage.getItem("pandora_access_reward_seen") : "true";
    if (!hasSeenSuccess && hasAccess) {
      sessionStorage.setItem("pandora_access_reward_seen", "true");
      // Silent intercept: Hide the success card and redirect directly to the main system
      if (typeof window !== 'undefined') {
        router.replace("/");
        setTimeout(() => {
          if (window.location.pathname !== "/") window.location.href = "/";
        }, 100);
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-lime-500/10 blur-xl rounded-full animate-pulse" />
            <Loader2 className="w-10 h-10 animate-spin text-lime-500 relative z-10" />
          </div>
          <p className="text-lime-400 font-mono text-xs tracking-widest uppercase animate-pulse">Iniciando Sistema...</p>
        </div>
      );
    }
    return <>{children}</>;
  }

  // ⏳ CASE 2: Auth loading
  if (status === "booting" || (isAuthLoading && account)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-lime-500/10 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-lime-500 relative z-10" />
        </div>
        <p className="text-gray-400 font-mono text-xs tracking-widest uppercase">Escaneando Identidad...</p>
      </div>
    );
  }

  // ⌛ Wait for localStorage hydration — prevents flash of form on reload
  if (!leadHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
      </div>
    );
  }

  // 🎭 CASE 3: Success animation
  if (visualState === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      router.replace("/");
    }} />;
  }

  // 🎭 CASE 4: Ritual in progress
  const isRitualInProgress = !["idle", "success", "error"].includes(visualState);
  if (isRitualInProgress) {
    const statusMap: Record<string, string> = {
      checking: "Sincronizando con el Oracle...",
      minting: "Invocando slot de acceso...",
      retrying: "Señal débil. Reintentando enlace...",
      confirming_irreversible: "Fijando identidad en el ledger...",
      finalizing: "Abriendo compuertas Genesis...",
    };
    return (
      <MintingProgressModal
        step={visualState as any}
        statusOverride={statusMap[visualState] || "Ejecutando protocolo..."}
        isMinting={visualState === "minting" || status === "minting"}
        onClose={() => { }}
      />
    );
  }

  // 🎭 CASE 5: Error (Stripe-Tier Stability Fix)
  if (visualState === "error" || status === "error") {
    // If the error comes from the AuthProvider status, we look for the last error message
    const infraError = status === "error" ? "Error de Infraestructura: La Capa de Resiliencia está activada. Verifica la conexión a Redis o Secrets (JWT)." : (errorMessage || "Señal interrumpida.");

    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md text-center p-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">Protocolo Interrumpido</h2>
        <p className="text-zinc-500 mb-8 max-w-sm text-sm leading-relaxed font-mono">
          {infraError}
        </p>

        {process.env.NODE_ENV === 'development' && (user as any)?._dev_debug && (
          <div className="mb-8 p-4 bg-zinc-900 border border-zinc-700/50 rounded-lg text-left max-w-md overflow-hidden">
            <p className="text-[10px] text-zinc-400 font-mono mb-2 uppercase opacity-50">Local Dev Diagnostics:</p>
            <pre className="text-[9px] text-red-400 font-mono whitespace-pre-wrap break-all">
              {JSON.stringify((user as any)._dev_debug, null, 2)}
            </pre>
            <p className="text-[8px] text-zinc-600 mt-2 italic">
              Tip: Check your local DATABASE_URL and Railway IP Whitelist.
            </p>
            
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="mt-4 w-full bg-red-500/10 text-red-500 py-2 rounded font-mono text-[9px] uppercase border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              ☢️ Nuclear Reset (Clear Storage)
            </button>
          </div>
        )}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => { 
                setVisualState("idle"); 
                ritualRunning.current = false; 
                refreshSession(); // Force re-validation
            }}
            className="w-full bg-white text-black px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-lime-400 transition-all active:scale-95"
          >
            Sincronizar Señal
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-zinc-900 text-zinc-500 px-8 py-3 rounded-full font-bold uppercase text-[9px] tracking-[0.2em] border border-zinc-800 hover:text-white transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // 🎭 CASE 6: Lead not yet captured → show capture gate
  if (!leadCaptured) {
    return <LeadCaptureGate onLeadCaptured={handleLeadCaptured} projectId={projectId} />;
  }

  // 🎭 CASE 7: Lead captured → Ritual entry
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="w-24 h-24 mb-10 relative">
        <Image src="/images/pkey.png" alt="Key" width={120} height={120} className="relative z-10 animate-float" />
        <div className="absolute inset-0 bg-lime-500/20 blur-3xl rounded-full animate-pulse" />
      </div>
      <h2 className="text-3xl font-black mb-3 tracking-tighter">ACCESO REQUERIDO</h2>
      <p className="text-zinc-500 mb-12 max-w-sm text-center leading-relaxed font-medium">
        Para entrar al Protocolo Pandora's, necesitas reclamar tu slot Genesis en la blockchain.
      </p>
      {/* Access Gate Button */}
      {isAdmin ? (
        <button
          onClick={runRitual}
          className="group relative bg-white text-black px-12 py-5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] hover:scale-105 hover:bg-lime-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 overflow-hidden"
        >
          <span className="relative z-10">Iniciar Ritual de Acceso</span>
          <div className="absolute inset-0 bg-gradient-to-r from-lime-500 to-lime-300 opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <button
            disabled
            className="bg-zinc-900 text-zinc-600 px-12 py-5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] border border-zinc-800 cursor-not-allowed opacity-50"
          >
            Acceso Restringido
          </button>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">
            Tu perfil está en lista de espera.
          </p>
        </div>
      )}

      {account && (
        <p className="text-[10px] text-zinc-700 mt-6 uppercase tracking-widest font-mono">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </p>
      )}
    </div>
  );
}
