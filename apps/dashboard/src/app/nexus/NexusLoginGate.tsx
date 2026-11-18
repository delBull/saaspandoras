"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, Wallet, CheckCircle2, AlertCircle, ChevronDown, MessageCircle } from "lucide-react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@saasfly/shared/thirdweb-client";
import {
  NEXUS_DEFAULT_PHONE_COUNTRY_CODE,
  describePhoneFailure,
  normalizePhoneE164,
} from "@saasfly/shared/nexus-phone";
import { wallets } from "@/lib/wallets";
import { config } from "@/config";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import {
  NEXUS_TOKEN_STORAGE_KEY,
  exchangeNexusSession,
  readNexusTokenFromUrl,
  scrubNexusTokenFromUrl,
} from "@/lib/nexus/session-client";

interface NexusLoginGateProps {
  requireCompletion?: boolean;
  initialAuth?: { address: string | null; email: string | null; whatsappPhone?: string | null } | null;
}

const PHONE_OPTIONS = { defaultCountryCode: NEXUS_DEFAULT_PHONE_COUNTRY_CODE };

interface NexusApiResult {
  ok: boolean;
  error: string | null;
}

async function readApiResult(res: Response): Promise<NexusApiResult> {
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  const record =
    payload !== null && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  return {
    ok: record.ok === true,
    error: typeof record.error === "string" ? record.error : null,
  };
}

function describeError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function NexusLoginGate({ requireCompletion = false, initialAuth = null }: NexusLoginGateProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialAuth?.email ?? "");
  // Prellenar el teléfono ya guardado evita que un re-registro lo borre.
  const [whatsappPhone, setWhatsappPhone] = useState(initialAuth?.whatsappPhone ?? "");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  
  const { user, status } = useAuth();
  const router = useRouter();

  // Interpretación visible del teléfono: si el número no trae código de país se
  // asume México, y el operador VE el valor exacto que se va a guardar antes de
  // enviarlo. Nada se reescribe de forma silenciosa.
  const storedPhone = initialAuth?.whatsappPhone ?? "";
  // Borrar el número es una acción explícita: sólo si había uno guardado y el
  // operador vació el campo. Se declara en el payload y se avisa en pantalla.
  const willClearStoredPhone = Boolean(storedPhone.trim()) && !whatsappPhone.trim();
  const phonePreview = whatsappPhone.trim()
    ? normalizePhoneE164(whatsappPhone, PHONE_OPTIONS)
    : null;
  const phoneHint = willClearStoredPhone
    ? "Se eliminará el número de WhatsApp guardado al actualizar el registro."
    : phonePreview
      ? phonePreview.ok
        ? phonePreview.assumedCountryCode
          ? `Se guardará como ${phonePreview.value} (se asumió +${phonePreview.assumedCountryCode}; escribe +código si es otro país).`
          : `Se guardará como ${phonePreview.value}.`
        : describePhoneFailure(phonePreview.reason, PHONE_OPTIONS)
      : null;

  // Canje del magic link por sesión: se hace UNA vez, con POST, y el token queda
  // quemado en la base. A partir de aquí la credencial vive en una cookie httpOnly
  // que JavaScript no puede leer (y por eso tampoco puede filtrar).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const bootstrap = async () => {
      const urlToken = readNexusTokenFromUrl();
      const storedToken = localStorage.getItem(NEXUS_TOKEN_STORAGE_KEY);
      const token = urlToken ?? storedToken;

      if (token) {
        const established = await exchangeNexusSession(token);
        if (cancelled) return;
        if (established) {
          // La copia en localStorage ya no es una credencial válida.
          localStorage.removeItem(NEXUS_TOKEN_STORAGE_KEY);
          if (urlToken) scrubNexusTokenFromUrl();
          // Sin token en la URL el servidor renderizó esta página como no
          // autenticada: hace falta un render nuevo. El token ya se borró de
          // localStorage, así que no hay bucle posible.
          if (!urlToken && !requireCompletion) {
            window.location.replace("/nexus");
          }
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [requireCompletion]);

  // Registro automático al conectar wallet: NO es un camino silencioso. Si el
  // servidor rechaza la petición, el operador ve el motivo en vez de un refresh
  // que parece exitoso.
  useEffect(() => {
    async function handleWeb3Registration() {
      if (!user || (status !== "has_access" && status !== "authenticated")) return;
      if (requireCompletion || hasRefreshed) return;
      setHasRefreshed(true);

      if (!name || !email || !user.address) {
        router.refresh();
        return;
      }

      let normalizedPhone: string | null = null;
      if (whatsappPhone.trim()) {
        const normalized = normalizePhoneE164(whatsappPhone, PHONE_OPTIONS);
        if (!normalized.ok) {
          setPhoneError(describePhoneFailure(normalized.reason, PHONE_OPTIONS));
          return;
        }
        normalizedPhone = normalized.value;
      }

      try {
        const res = await fetch("/api/nexus/collaborators/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            whatsappPhone: normalizedPhone,
          }),
        });
        const data = await readApiResult(res);
        if (!res.ok || !data.ok) {
          setResult({
            type: "error",
            message: data.error ?? "No se pudo completar el registro automático de la wallet.",
          });
          return;
        }
        router.refresh();
      } catch (error: unknown) {
        setResult({
          type: "error",
          message: describeError(error, "Error de conexión al registrar tu wallet."),
        });
      }
    }
    void handleWeb3Registration();
  }, [user, status, router, name, email, whatsappPhone, requireCompletion, hasRefreshed]);

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    let normalizedPhone: string | undefined;
    if (whatsappPhone.trim()) {
      const normalized = normalizePhoneE164(whatsappPhone, PHONE_OPTIONS);
      if (!normalized.ok) {
        setPhoneError(describePhoneFailure(normalized.reason, PHONE_OPTIONS));
        return;
      }
      normalizedPhone = normalized.value;
    }
    setPhoneError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/nexus/collaborators/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          whatsappPhone: normalizedPhone,
        }),
      });

      const data = await readApiResult(res);
      if (res.ok && data.ok) {
        setResult({
          type: "success",
          // Copy condicional: la respuesta del servidor es idéntica exista o no el
          // colaborador (anti-enumeración), así que no se afirma que se envió.
          message: `Si ${email.trim()} está registrado como colaborador, recibirás un enlace de acceso.`,
        });
        setEmail("");
        setWhatsappPhone("");
        setPhoneError("");
      } else {
        setResult({
          type: "error",
          message: data.error ?? "No se pudo generar el enlace de acceso.",
        });
      }
    } catch (error: unknown) {
      setResult({
        type: "error",
        message: describeError(error, "Error de conexión al solicitar el acceso."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    let formattedPhone: string | null = null;
    if (whatsappPhone.trim()) {
      const normalized = normalizePhoneE164(whatsappPhone, PHONE_OPTIONS);
      if (!normalized.ok) {
        setPhoneError(describePhoneFailure(normalized.reason, PHONE_OPTIONS));
        return;
      }
      formattedPhone = normalized.value;
    }
    setPhoneError('');
    setLoading(true);
    setResult(null);

    try {
      // La billetera autoritativa la resuelve el servidor desde la sesión
      // (`auth.wallet`); jamás se envía ni se fabrica una dirección desde el cliente.
      const res = await fetch("/api/nexus/collaborators/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          whatsappPhone: formattedPhone,
          clearWhatsappPhone: willClearStoredPhone,
        }),
      });

      const data = await readApiResult(res);
      if (res.ok && data.ok) {
        setResult({
          type: "success",
          message: `Registro completado. Redirigiendo...`,
        });
        // Hard navigation (full server render) instead of router.refresh():
        // guarantees NexusRootPage re-resolves auth fresh so the completion gate
        // actually clears (wallet/SUPER_ADMIN sessions previously looped forever).
        // La cookie ya la sincronizó el effect de hidratación; la URL de destino va
        // limpia para no dejar el bearer en la barra de direcciones.
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.assign("/nexus");
          }
        }, 1200);
      } else {
        setResult({
          type: "error",
          message: data.error ?? "Error al actualizar registro.",
        });
      }
    } catch (error: unknown) {
      setResult({
        type: "error",
        message: describeError(error, "Error de conexión al guardar el registro."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Subtle Pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10 space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-mono tracking-widest uppercase">
            Sovereign Command Plane
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pandora&apos;s Nexus
          </h1>

          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Plataforma central de mando y operaciones. Identifícate mediante tu billetera institucional o solicita un magic link.
          </p>
        </div>

        {/* Auth Methods Box */}
        <div className="bg-[#0e0e16] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          
          {requireCompletion ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300">
                Registro Obligatorio de Operador
              </h3>
              <p className="text-xs text-amber-400/90 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                Tu cuenta tiene una sesión activa, pero debes completar tu información operativa para acceder al Nexus.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre Completo"
                  className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!initialAuth?.email}
                  placeholder="tu-correo@empresa.com"
                  className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                  required
                />
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => { setWhatsappPhone(e.target.value); setPhoneError(''); }}
                  placeholder="WhatsApp opcional (ej. +52 1 55 1234 5678)"
                  className={`w-full bg-zinc-900/80 border rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                    phoneError ? 'border-rose-500/60 focus:border-rose-500' : 'border-zinc-700/80 focus:border-amber-500/50'
                  }`}
                />
                {(phoneError || phoneHint) && (
                  <p
                    className={`text-[10px] font-mono pl-1 ${
                      phoneError || (phonePreview && !phonePreview.ok)
                        ? "text-rose-400"
                        : willClearStoredPhone
                          ? "text-amber-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {phoneError || phoneHint}
                  </p>
                )}
              </div>
              <button
                onClick={handleUpdateRegistration}
                disabled={loading || !name || !email}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 mt-4"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading ? "Actualizando..." : "Actualizar Registro y Entrar"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Method 1: Web3 Wallet */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  1. Acceso con Billetera Institucional
                </label>
                <div className="flex justify-center w-full">
                  {client ? (
                    <div className="w-full space-y-1.5 flex flex-col items-center">
                      <ConnectButton connectModal={{ showThirdwebBranding: false }} 
                        client={client}
                        chain={config.chain}
                        theme="dark"
                        wallets={wallets}
                        connectButton={{
                          label: "Conectar Wallet Web3",
                          className: "!w-full !py-3 !rounded-xl !bg-zinc-800 !text-white !font-semibold !border !border-zinc-700 !hover:bg-zinc-700 !text-xs",
                        }}
                      />
                      <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                        Soporta MetaMask, Rabby, Phantom, Rainbow y <span className="text-purple-400 font-medium">WalletConnect</span> para cualquier app móvil.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center text-xs text-zinc-500">
                      Web3 Provider Initializing...
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0e0e16] px-3 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                  o mediante magic link
                </span>
              </div>

              {/* Method 2: Magic Link */}
              <form onSubmit={handleRequestMagicLink} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    2. Correo y WhatsApp
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">Hermes Ready</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@empresa.com"
                    className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                    required
                  />
                  <input
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => {
                      setWhatsappPhone(e.target.value);
                      setPhoneError('');
                    }}
                    placeholder="+52 1 55 1234 5678 (WhatsApp para notificaciones de Hermes)"
                    className={`w-full bg-zinc-900/80 border rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                      phoneError ? 'border-rose-500/60 focus:border-rose-500' : 'border-zinc-700/80 focus:border-amber-500/50'
                    }`}
                  />
                  {(phoneError || phoneHint) && (
                    <p
                      className={`text-[10px] font-mono pl-1 ${
                        phoneError || (phonePreview && !phonePreview.ok)
                          ? "text-rose-400"
                          : willClearStoredPhone
                            ? "text-amber-400"
                            : "text-zinc-500"
                      }`}
                    >
                      {phoneError || phoneHint}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {loading ? "Verificando..." : "Solicitar Enlace de Acceso"}
                </button>
              </form>
            </div>
          )}

          {result && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                result.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        {/* Why these methods */}
        <details className="group w-full bg-[#0e0e16] border border-white/10 rounded-2xl overflow-hidden">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-4 text-xs font-semibold text-zinc-300 hover:bg-white/[0.03] transition-colors">
            <span className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-400" />
              ¿Por qué dos métodos de autenticación?
            </span>
            <ChevronDown className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform" />
          </summary>

          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className={`p-2.5 rounded-lg shrink-0 ${"bg-blue-500/10 border border-blue-500/30 text-blue-400"}`}>
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-1">Wallet Web3 — Identidad On-Chain</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Crea tu Smart Wallet institucional. Necesaria para firmar transacciones, acceder a
                  activos tokenizados y participar en gobernanza on-chain dentro del ecosistema Pandoras.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-2.5 rounded-lg shrink-0 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">Email — Acceso al Ecosistema Interno</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Recibe Magic Links de acceso, notificaciones de deals, reportes de Hermes y
                  comunicaciones operativas cifradas del ecosistema Pandoras.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-2.5 rounded-lg shrink-0 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">¿Por qué tu número de WhatsApp?</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  El número de WhatsApp permite que la IA de Hermes te asigne tareas y te envíe
                  notificaciones críticas directamente a tu teléfono mediante el Meta Graph API.
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-500">
          Soberanía Criptográfica · Protocolo Pandora&apos;s OS
        </p>
      </motion.div>
    </div>
  );
}
