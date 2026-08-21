"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Lock, Mail, Check, FileSignature, Loader2, Wallet, ShieldCheck, ChevronDown, ChevronUp, AlertTriangle, Download, XCircle } from "lucide-react";
import { useActiveAccount, useActiveWallet, ConnectButton, darkTheme, useDisconnect } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { buildSignMessage } from "@/lib/nexus-deals/signing";
import { buildCombinedSignMessage } from "@/lib/nexus-deals/nda-content";
import { NDAModal } from "@/components/modals/NDAModal";
import { DealAttachments } from "./DealAttachments";
import { DealComments } from "./DealComments";

interface PublicSection {
  code: string;
  title: string;
  subtitle: string;
  content: string;
}

interface PublicRoom {
  publicId: string;
  kind: "PROPOSAL" | "AGREEMENT" | "CONTRACT" | "AMENDMENT" | "CHARTER";
  counterparty: string;
  relation: string;
  company: string;
  status: string;
  summary?: string | null;
  openSign?: boolean | null;
  enteredIntoForceAt?: string | null;
  // NDA Engine fields
  ndaEnabled?: boolean;
  ndaPhase?: string;
  ndaVersion?: string;
  sections: PublicSection[];
  // Room chaining
  nextRoomPublicId?: string | null;
  nextRoomKind?: string | null;
  nextRoomKindLabel?: string | null;
}

const KIND_LABEL: Record<PublicRoom["kind"], string> = {
  PROPOSAL: "Propuesta de Colaboración",
  AGREEMENT: "Acuerdo",
  CONTRACT: "Contrato",
  AMENDMENT: "Adenda",
  CHARTER: "Acta Constitutiva",
};

// Wallets disponibles para firmar: el in-app (social/email/passkey) se mantiene
// primero para no romper el flujo actual, y se agregan wallets externas (MetaMask,
// Coinbase, Rabby, Rainbow y móviles vía WalletConnect). La firma es EIP-191
// (firma de mensaje), por lo que es gratuita sin importar la wallet usada.
const signerWallets = [
  inAppWallet({
    auth: {
      options: ["google", "apple", "telegram", "facebook", "email", "passkey"],
      mode: "popup",
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
  createWallet("me.rainbow"),
  createWallet("walletConnect"),
];

// Botón de firma con identidad Pandoras: gradiente ámbar→esmeralda, sombra y márgenes consistentes.
const SIGN_BUTTON_STYLE =
  "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-[12px] tracking-wider " +
  "bg-gradient-to-r from-amber-500/90 to-emerald-500/80 text-black font-semibold " +
  "shadow-[0_4px_24px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_32px_rgba(245,158,11,0.4)] " +
  "hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none";

interface Props {
  publicId: string;
  room: PublicRoom;
  initialEmail: string | null;
  rawToken: string | null;
  expectedWallet?: string | null;
}

export default function DealSignerClient({ publicId, room, initialEmail, rawToken, expectedWallet }: Props) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingMagic, setSendingMagic] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  const [openSection, setOpenSection] = useState(room.sections[0]?.code ?? "01");
  const [signName, setSignName] = useState("");
  const [signCompany, setSignCompany] = useState("");
  const [signRole, setSignRole] = useState("Representante Legal");
  const [signing, setSigning] = useState(false);
  const [signingNda, setSigningNda] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  // ── NDA STATE ──────────────────────────────────────────────────────────────
  type NdaStep = "loading" | "required" | "bypassed" | "signed" | "none";
  const [ndaStep, setNdaStep] = useState<NdaStep>("loading");
  const [ndaChecked, setNdaChecked] = useState(false);      // user checked the checkbox
  const [ndaExpanded, setNdaExpanded] = useState(false);    // full text expanded
  const [ndaModalOpen, setNdaModalOpen] = useState(false);  // open full document modal
  const [ndaSignatureHash, setNdaSignatureHash] = useState<string | null>(null);

  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  
  const isProposal = room.kind === "PROPOSAL";
  const isOpenSign = Boolean(room.openSign);
  const unlocked = Boolean(initialEmail && rawToken) || isOpenSign;
  const signerId = isOpenSign ? (account?.address?.toLowerCase() ?? "") : (initialEmail ?? "");
  const ndaVersion = room.ndaVersion ?? "v2.2";
  const effectiveNdaEnabled = Boolean(room.ndaEnabled);

  // ── NDA CHECK ON MOUNT ───────────────────────────────────────────────────
  // Once we know the wallet/email, check if NDA is needed and if already signed.
  useEffect(() => {
    if (!effectiveNdaEnabled) { setNdaStep("none"); return; }
    const identifier = isOpenSign ? account?.address?.toLowerCase() : initialEmail?.toLowerCase();
    if (!identifier) { setNdaStep(effectiveNdaEnabled ? "required" : "none"); return; }

    fetch(`/api/public/deals/${publicId}/nda?${isOpenSign ? "wallet" : "email"}=${encodeURIComponent(identifier)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ndaEnabled) { setNdaStep("none"); return; }
        if (data.alreadySigned) {
          setNdaStep("bypassed");
          if (data.previousAcceptance?.wallet) {
            setNdaSignatureHash(data.previousAcceptance.wallet);
          }
        } else {
          setNdaStep("required");
        }
      })
      .catch(() => setNdaStep("required"));
  }, [effectiveNdaEnabled, account?.address, initialEmail, isOpenSign, publicId]);

  const requestMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSendingMagic(true);
    setMagicError(null);
    try {
      const res = await fetch(`/api/public/deals/${publicId}/magic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setEmailSent(true);
    } catch (err: any) {
      setMagicError(err.message ?? "Error al enviar. Intenta de nuevo.");
    } finally {
      setSendingMagic(false);
    }
  };

  /**
   * 🛡️ Firma Independiente del NDA On-Chain
   * Registra en nexus_nda_acceptances, dispara alertas y desbloquea el acuerdo.
   */
  const handleSignNdaOnly = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!account?.address) return;
    if (!ndaChecked) {
      setSignError("Debes marcar la casilla para aceptar el Acuerdo de Confidencialidad.");
      return;
    }

    setSigningNda(true);
    setSignError(null);
    try {
      const emailId = isOpenSign ? account.address.toLowerCase() : initialEmail ?? account.address.toLowerCase();
      const ts = new Date().toISOString();
      const message = `Pandora's Ecosystem — Acuerdo de Confidencialidad (${ndaVersion})\n\nAl firmar este mensaje reconozco que:\n1. He leído y entiendo el Acuerdo de Confidencialidad, No Uso y Protección de Información Confidencial de Pandora's Ecosystem versión ${ndaVersion}.\n2. Acepto voluntariamente todas sus obligaciones y restricciones.\n3. Esta firma electrónica constituye mi consentimiento legalmente vinculante conforme al Código de Comercio mexicano.\n\nIdentidad: ${emailId}\nWallet: ${account.address.toLowerCase()}\nTimestamp: ${ts}\nVersión: ${ndaVersion}`;

      let signature = "";
      try {
        signature = await account.signMessage({ message });
      } catch (sigErr) {
        setSignError("Firma de NDA cancelada. No se registró ningún cambio.");
        return;
      }
      if (!signature) {
        setSignError("No se pudo generar la firma del NDA. Intenta de nuevo.");
        return;
      }

      const res = await fetch(`/api/public/deals/${publicId}/nda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailId,
          name: signName.trim() || room.counterparty || "Representante Autorizado",
          wallet: account.address,
          signature,
          timestamp: ts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar el NDA");

      setNdaSignatureHash(signature);
      setNdaStep("signed");
    } catch (err: any) {
      setSignError(err.message ?? "Error al firmar el NDA. Intenta de nuevo.");
    } finally {
      setSigningNda(false);
    }
  };

  const handleSign = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const name = signName.trim();
    if (!name || !account?.address) return;
    if (!isOpenSign && !rawToken) return;

    // Auto-detect combined: NDA required but not yet recorded → single on-chain signature
    const needsNda = effectiveNdaEnabled && ndaStep === "required";
    if (needsNda && !ndaChecked) {
      setSignError("Debes aceptar el Acuerdo de Confidencialidad para continuar.");
      return;
    }

    setSigning(true);
    setSignError(null);
    try {
      const emailId = isOpenSign ? account.address.toLowerCase() : initialEmail ?? "";
      const ts = new Date().toISOString();

      // Combined when: NDA required+checked (first time), or NDA already signed/bypassed
      const usesCombined = effectiveNdaEnabled && (needsNda || ndaStep === "signed" || ndaStep === "bypassed");
      const companyVal = signCompany.trim() || room.company || undefined;
      const roleVal = signRole.trim() || "Representante Legal";
      const message = usesCombined
        ? buildCombinedSignMessage({
            email: emailId,
            name,
            company: companyVal,
            role: roleVal,
            wallet: account.address.toLowerCase(),
            publicId,
            dealKind: room.kind,
            dealCounterparty: companyVal || room.counterparty,
            ndaVersion,
            timestamp: ts,
          })
        : buildSignMessage({
            publicId,
            kind: room.kind,
            counterparty: companyVal || room.counterparty,
            email: emailId,
            name,
            company: companyVal,
            role: roleVal,
          });

      let signature = "";
      try {
        signature = await account.signMessage({ message });
      } catch (sigErr) {
        setSignError("Firma cancelada. No se registró ningún cambio.");
        return;
      }
      if (!signature) {
        setSignError("No se pudo generar la firma. Intenta de nuevo.");
        return;
      }

      const res = await fetch(`/api/public/deals/${publicId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: rawToken ?? undefined,
          name,
          company: companyVal,
          role: roleVal,
          wallet: account.address,
          signature,
          // NDA combined flow fields
          isCombined: usesCombined,
          ndaTimestamp: usesCombined ? ts : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al firmar");
      setSigned(true);
    } catch (err: any) {
      setSignError(err.message ?? "Error al firmar. Intenta de nuevo.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08080A] print:bg-white text-zinc-100 print:text-black font-sans flex flex-col">
      <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#0C0C10] print:hidden border-b border-white/10 font-mono">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 shrink-0">
            <Handshake className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-zinc-100 tracking-tight truncate">PANDORA'S NEXUS · TRANSACTION ROOM</span>
            <p className="text-[10px] text-zinc-500 truncate">{room.publicId}</p>
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
          </span>
          CONFIDENTIAL
        </span>
      </header>

      {unlocked ? (
        <div className="flex-1 flex flex-col md:flex-row min-h-0 print:block">
          {/* Document */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-amber-500/30 bg-amber-500/10 text-amber-300 print:border-black print:text-black print:bg-transparent">
                    {KIND_LABEL[room.kind]}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-white/10 bg-black/40 text-zinc-400 print:border-black print:text-black print:bg-transparent">
                    {room.relation}
                  </span>
                </div>
                
                {["SIGNED", "EXECUTING", "EXECUTED"].includes(room.status) && (
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-[11px] font-mono text-zinc-300 transition-colors print:hidden"
                  >
                    <Download className="w-3.5 h-3.5" />
                    DESCARGAR PDF
                  </button>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white print:text-black tracking-tight">
                {room.summary || KIND_LABEL[room.kind]}
              </h1>
              <div className="mt-3 mb-4 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Contraparte B2B:</span>
                  <p className="text-[14px] font-bold text-white print:text-black">{signCompany || room.company || room.counterparty}</p>
                </div>
                <p className="text-[11px] font-mono text-zinc-400 mt-1 print:text-black">
                  Representante Legal: <span className="text-zinc-200">{signName || room.counterparty}</span> {signRole ? `(${signRole})` : ""}
                </p>
              </div>

              {/* ── ACTIVE NDA BADGE ──────────────────────────────────── */}
              {effectiveNdaEnabled && (ndaStep === "signed" || ndaStep === "bypassed") && (
                <div className="mb-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] flex items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                    <div>
                      <p className="text-[11px] font-mono text-emerald-300 font-semibold">Acuerdo de Confidencialidad (NDA {ndaVersion}) Activo</p>
                      <p className="text-[10px] text-zinc-400">Protección legal y evidencia criptográfica verificada on-chain.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNdaModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-[10px] font-mono hover:bg-emerald-500/20 transition-colors shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    DESCARGAR NDA (PDF)
                  </button>
                </div>
              )}

              {isProposal && (
                <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.06]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-blue-300 mb-1">Documento de trabajo · No vinculante</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Este documento representa una propuesta inicial de colaboración y sirve como base para conversación,
                    retroalimentación y construcción conjunta del modelo definitivo. No constituye un acuerdo formal.
                  </p>
                </div>
              )}

              {room.enteredIntoForceAt && (
                <div className="mt-4 p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07]">
                  <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-300 mb-1">
                    <Check className="w-3.5 h-3.5" /> Acuerdo legítimo en vigor
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Este documento fue firmado por todas las partes y entró en vigor el{' '}
                    <span className="text-emerald-200 font-mono">
                      {new Date(room.enteredIntoForceAt).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    . A partir de esta fecha constituye un acuerdo vigente según sus términos.
                  </p>
                </div>
              )}

              {room.status === "SIGNED" && room.nextRoomPublicId && (
                <div className="mt-4 p-4 rounded-xl border border-violet-500/25 bg-violet-500/[0.07]">
                  <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-violet-300 mb-1">
                    <FileSignature className="w-3.5 h-3.5" /> Siguiente Documento Disponible
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                    El <span className="text-violet-200 font-semibold">{room.nextRoomKindLabel}</span> ha sido desbloqueado como seguimiento de este acuerdo.
                    Está listo para revisión y firma.
                  </p>
                  <a
                    href={`/deal/${room.nextRoomPublicId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-200 text-[12px] font-semibold hover:bg-violet-500/30 transition-colors"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    Abrir {room.nextRoomKindLabel}
                  </a>
                </div>
              )}

              {room.summary && (
                <p className="mt-4 text-[12px] text-zinc-400 print:text-black leading-relaxed">{room.summary}</p>
              )}
            </div>

            {/* ── DOCUMENT CLAUSES OR NDA GATE ────────────────────────── */}
            {effectiveNdaEnabled && ndaStep === "required" ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-8 text-center my-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-300">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Documento Confidencial Protegido por NDA</h2>
                <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed mb-6">
                  Para acceder y revisar las cláusulas de este acuerdo B2B ({room.summary || KIND_LABEL[room.kind]}), es obligatorio firmar previamente el Acuerdo de Confidencialidad y No Uso (NDA) de Pandora's Ecosystem.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs font-mono">
                  <ShieldCheck className="w-4 h-4" /> Firma el NDA en el panel lateral para desbloquear este documento
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {room.sections.map((sec) => (
                  <div key={sec.code} className="rounded-xl border border-white/10 bg-[#0C0C10] overflow-hidden">
                    <button
                      onClick={() => setOpenSection(openSection === sec.code ? "" : sec.code)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-amber-300/80">{sec.code}</span>
                        <span className="text-[13px] text-zinc-100">{sec.title}</span>
                      </span>
                      <span className={`text-zinc-600 transition-transform ${openSection === sec.code ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {openSection === sec.code && (
                      <div className="px-4 pb-4 space-y-1.5">
                        {sec.content.split("\n").filter(Boolean).map((line, i) => (
                          <p key={i} className="text-[12px] text-zinc-300 print:text-black leading-relaxed">
                            <span className="text-zinc-600 print:text-black font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                            {line}
                          </p>
                        ))}
                        {unlocked && (
                          <div className="print:hidden">
                            <DealComments publicId={publicId} sectionCode={sec.code} rawToken={rawToken} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {signed && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                className="mt-6 p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04]"
              >
                <div className="flex items-start gap-3">
                  <FileSignature className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-200">Aceptación Criptográfica B2B Verificada</h3>
                    <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
                      El presente documento ha sido aceptado electrónicamente y firmado on-chain en representación de <strong>{signCompany || room.company || room.counterparty}</strong> por <strong>{signName || account?.address}</strong> ({signRole || "Representante Legal"}).
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <NDAModal 
            isOpen={ndaModalOpen} 
            onClose={() => setNdaModalOpen(false)} 
            version={ndaVersion} 
          />
        </div>

          {/* Sidebar / Sign Box */}
          <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-white/10 p-4 md:p-6 bg-[#08080A] print:hidden flex flex-col">
          <div className="max-w-sm mx-auto md:mx-0">
            {signed ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] text-center">
                <Check className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-emerald-200">¡Acuerdo B2B Firmado!</h3>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  Tu aceptación quedó registrada en el audit trail del Deal Room. Gracias por tu confianza.
                </p>
                <button
                  onClick={() => window.print()}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 text-[11px] font-mono hover:bg-emerald-500/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  DESCARGAR ACUERDO (PDF)
                </button>
              </motion.div>
            ) : (initialEmail && rawToken) || isOpenSign ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Step header */}
                {(initialEmail && rawToken) ? (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      <Mail className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">Identidad verificada</p>
                      <p className="text-[10px] text-zinc-400 truncate">{initialEmail}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
                      <FileSignature className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">Firma online habilitada</p>
                      <p className="text-[10px] text-zinc-400">No se requiere correo · firma on-chain verificada</p>
                    </div>
                  </div>
                )}

                {/* ── PASO 1: NDA REQUIREMENT & SIGNING ─────────────────── */}
                {effectiveNdaEnabled && ndaStep === "loading" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-black/30">
                    <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin shrink-0" />
                    <p className="text-[11px] text-zinc-500">Verificando estado del NDA…</p>
                  </div>
                )}

                {effectiveNdaEnabled && ndaStep === "required" && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-bold">Paso 1: Firma de NDA</p>
                        <p className="text-[10px] text-zinc-400">Requerido antes de ver y firmar el acuerdo</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      El <strong className="text-zinc-200">Acuerdo de Confidencialidad Pandora's ({ndaVersion})</strong> protege la información estratégica de ambas partes con vigencia de 5 años.
                    </p>

                    <button
                      type="button"
                      onClick={() => setNdaModalOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-white/10 rounded-lg text-[10px] text-zinc-300 hover:bg-white/5 transition-colors uppercase tracking-widest font-mono"
                    >
                      <FileSignature className="w-3 h-3" />
                      Ver Master NDA Completo
                    </button>

                    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                      <div
                        onClick={() => setNdaChecked(!ndaChecked)}
                        className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors cursor-pointer
                          ${ndaChecked ? "bg-amber-500 border-amber-500" : "border-white/20 bg-black/30 hover:border-amber-500/50"}`}
                      >
                        {ndaChecked && <Check className="w-2.5 h-2.5 text-black" />}
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        He leído y acepto el <strong className="text-amber-300">Acuerdo de Confidencialidad {ndaVersion}</strong>.
                      </p>
                    </label>

                    {account?.address ? (
                      <button
                        type="button"
                        onClick={handleSignNdaOnly}
                        disabled={signingNda || !ndaChecked}
                        className={SIGN_BUTTON_STYLE}
                      >
                        {signingNda ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        {signingNda ? "FIRMANDO NDA..." : "FIRMAR ACUERDO DE CONFIDENCIALIDAD (NDA)"}
                      </button>
                    ) : (
                      <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                        <p className="text-[10px] text-zinc-500 mb-2">Conecta tu wallet para firmar el NDA (gratis · sin gas):</p>
                        <ConnectButton
                          client={client}
                          wallets={signerWallets}
                          connectButton={{ label: "Conectar para firmar NDA" }}
                          connectModal={{ size: "compact", title: "Verificar identidad", showThirdwebBranding: false }}
                          theme={darkTheme({ colors: { primaryButtonBg: "#10b981", primaryButtonText: "#000" } })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ── PASO 2: AGREEMENT SIGNING FORM ───────────────────── */}
                {(!effectiveNdaEnabled || ndaStep === "signed" || ndaStep === "bypassed" || ndaStep === "none") && (
                  <>
                    <h3 className="text-sm font-semibold text-white">
                      {isProposal ? "Aceptar propuesta B2B" : "Firmar acuerdo B2B"}
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Ingresa los datos de tu empresa y representación legal para firmar on-chain este acuerdo.
                    </p>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">Nombre del Representante Legal *</label>
                        <input
                          type="text"
                          placeholder="Tu nombre completo"
                          value={signName}
                          onChange={(e) => setSignName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">Empresa / Razón Social *</label>
                        <input
                          type="text"
                          placeholder="Ej: ESCUELA LIBRE DIGITAL"
                          value={signCompany}
                          onChange={(e) => setSignCompany(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">Cargo o Poder Legal *</label>
                        <input
                          type="text"
                          placeholder="Ej: Representante Legal / Director"
                          value={signRole}
                          onChange={(e) => setSignRole(e.target.value)}
                          className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                        />
                      </div>
                      
                      {signName && (
                        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] text-[11px] text-amber-200/80 leading-relaxed">
                          Firmarás como: <strong className="text-amber-300 not-italic">{signName}</strong> ({signRole || "Representante"}) en representación de <strong className="text-amber-300 not-italic">{signCompany || room.company || room.counterparty}</strong>
                        </div>
                      )}

                      {account?.address ? (
                        expectedWallet && account.address.toLowerCase() !== expectedWallet.toLowerCase() ? (
                          <div className="flex flex-col gap-2 px-3 py-2.5 rounded-lg border border-rose-500/40 bg-rose-500/[0.06]">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[9px] font-mono uppercase tracking-widest text-rose-400">Cuenta incorrecta</p>
                                <p className="text-[10px] font-mono text-zinc-300 truncate">{account.address}</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-rose-300/80 leading-relaxed">
                              Esta sesión está vinculada a otra cuenta (<span className="font-mono text-rose-200">{expectedWallet.slice(0,6)}...{expectedWallet.slice(-4)}</span>). No puedes proceder con una cuenta diferente.
                            </p>
                            <button
                              type="button"
                              onClick={() => { if (activeWallet) disconnect(activeWallet); }}
                              className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-200 text-[11px] font-mono transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              DESCONECTAR
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06]">
                            <div className="flex items-center gap-2 min-w-0">
                              <Wallet className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-300">Cuenta conectada</p>
                                <p className="text-[10px] font-mono text-zinc-300 truncate">{account.address}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { if (activeWallet) disconnect(activeWallet); }}
                              className="text-[10px] font-mono text-emerald-400/70 hover:text-emerald-300 transition-colors underline decoration-emerald-400/30 underline-offset-2 shrink-0"
                            >
                              Salir
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                          <p className="text-[10px] text-zinc-500 mb-2">Conecta tu wallet para firmar el acuerdo (gratis · sin gas):</p>
                          <ConnectButton
                            client={client}
                            wallets={signerWallets}
                            connectButton={{ label: "Conectar y firmar" }}
                            connectModal={{ size: "compact", title: "Verificar identidad", showThirdwebBranding: false }}
                            theme={darkTheme({ colors: { primaryButtonBg: "#10b981", primaryButtonText: "#000" } })}
                          />
                        </div>
                      )}

                      {signError && <p className="text-[11px] text-rose-400">{signError}</p>}
                      <button
                        type="button"
                        onClick={handleSign}
                        disabled={signing || !signName.trim() || !account?.address || (!!expectedWallet && account.address.toLowerCase() !== expectedWallet.toLowerCase())}
                        className={SIGN_BUTTON_STYLE}
                      >
                        {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
                        {signing ? "FIRMANDO..." : isProposal ? "ACEPTAR PROPUESTA B2B" : "FIRMAR ACUERDO B2B"}
                      </button>
                    </form>
                    <p className="text-[9px] text-zinc-600 mt-1 text-center leading-relaxed">
                      Firma on-chain verificada (EIP-191) · gratis, sin gas · audit trail inmutable
                    </p>
                  </>
                )}
                
                {/* ── ATTACHMENTS ────────────────────────────────────────── */}
                <DealAttachments publicId={publicId} rawToken={rawToken} />
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="w-full max-w-md mx-auto mt-8 md:mt-16">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/20 bg-[#0C0C10] p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  <Lock className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">Acceso protegido</p>
                  <p className="text-[10px] text-zinc-500 truncate">{room.publicId}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  {KIND_LABEL[room.kind]}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white mb-1">Documento confidencial</h2>
              <p className="text-[12px] text-zinc-400 leading-relaxed mb-5">
                Este documento está restringido a los firmantes autorizados. Ingresa tu correo electrónico:
                si estás registrado, recibirás un enlace único de acceso para leerlo y firmarlo.
              </p>

              {emailSent ? (
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                  <Check className="w-5 h-5 text-amber-300 mb-2" />
                  <p className="text-[12px] text-amber-200">Enlace enviado</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Revisa tu bandeja de entrada. El enlace es de un solo uso y expira en 7 días.</p>
                </div>
              ) : (
                <form onSubmit={requestMagic} className="space-y-3">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                  />
                  {magicError && <p className="text-[11px] text-rose-400">{magicError}</p>}
                  <button
                    type="submit"
                    disabled={sendingMagic || !email.includes("@")}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[12px] font-mono transition-colors disabled:opacity-50"
                  >
                    {sendingMagic ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    ENVIAR ENLACE DE ACCESO
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      )}

      <footer className="h-9 shrink-0 flex items-center justify-center px-4 bg-[#0C0C10] border-t border-white/10 font-mono text-[10px] text-zinc-600">
        Pandoras Group · Confidential · Transaction Room {room.publicId}
      </footer>
    </main>
  );
}
