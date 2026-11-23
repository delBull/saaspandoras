"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Lock, Mail, Check, FileSignature, Loader2, Wallet, ShieldCheck, ChevronDown, ChevronUp, AlertTriangle, Download, XCircle, ChevronRight, Activity } from "lucide-react";
import { useActiveAccount, useActiveWallet, ConnectButton, darkTheme, useDisconnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets/in-app";
import { createWallet } from "thirdweb/wallets";
import { client } from "@saasfly/shared/thirdweb-client";
import { buildSignMessage } from "@saasfly/nexus-deals-sdk";
import { buildCombinedSignMessage, buildNdaSignMessage } from "@saasfly/nexus-deals-sdk";
import { NDAModal } from "@/components/modals/NDAModal";
import { useSovereignDisplay } from "@pandoras/display-engine";
import { DealAttachments } from "./DealAttachments";
import { DealComments } from "./DealComments";
import { DisplayControlsWidget } from "@pandoras/display-engine";

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
  cognitiveSummary?: string[] | null;
  openSign?: boolean | null;
  enteredIntoForceAt?: string | null;
  // NDA Engine fields
  ndaEnabled?: boolean;
  ndaPhase?: string;
  ndaVersion?: string;
  /** El deal activó prueba de fondos (se decide al crear la sala). */
  pofEnabled?: boolean;
  sections: PublicSection[];
  // Room chaining
  nextRoomPublicId?: string | null;
  nextRoomKind?: string | null;
  nextRoomKindLabel?: string | null;
  signers?: {
    status: string;
    signedAt: string | null;
    signatureName: string | null;
    signatureCompany: string | null;
    signatureRole: string | null;
    wallet: string | null;
    signature?: string | null;
  }[];
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
  createWallet("io.rabby"),
  createWallet("com.coinbase.wallet"),
  createWallet("app.phantom"),
  createWallet("me.rainbow"),
  createWallet("walletConnect"),
];

// Botón de firma con identidad Pandoras: gradiente ámbar→esmeralda, sombra y márgenes consistentes.
const SIGN_BUTTON_STYLE =
  "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-[13px] tracking-wider " +
  "bg-gradient-to-r from-amber-500/90 to-emerald-500/80 text-black font-semibold " +
  "shadow-[0_4px_24px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_32px_rgba(245,158,11,0.4)] " +
  "hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none";

const COMPANY_TYPES = [
  { value: "", label: "Sin sufijo (denominación completa tal cual)" },
  { value: "LLC", label: "LLC (Limited Liability Company)" },
  { value: "S.A. de C.V.", label: "S.A. de C.V." },
  { value: "S.A.P.I. de C.V.", label: "S.A.P.I. de C.V." },
  { value: "S. de R.L. de C.V.", label: "S. de R.L. de C.V." },
  { value: "Inc.", label: "Inc. (Corporation)" },
  { value: "S.L.", label: "S.L. (Sociedad Limitada)" },
  { value: "Otra", label: "Otra entidad jurídica" },
] as const;

interface Props {
  publicId: string;
  room: PublicRoom;
  initialEmail: string | null;
  rawToken: string | null;
  expectedWallet?: string | null;
  /** Aceptación de NDA registrada en el servidor para este correo. */
  ndaSigned?: boolean;
  /** Semilla del radar (`?src=`) que trajo al visitante. */
  srcCode?: string | null;
}

export default function DealSignerClient({ publicId, room, initialEmail, rawToken, expectedWallet, ndaSigned = false, srcCode = null }: Props) {
  // El display engine escala con font-size (rems); el deal room usa px, así que
  // aquí aplicamos un zoom real y anulamos el font-size mientras estamos montados.
  const { profile } = useSovereignDisplay();
  useEffect(() => {
    const root = document.documentElement;
    const previousFontSize = root.style.fontSize;
    const previousZoom = (root.style as any).zoom ?? "";
    const factor = profile.scale === "130" ? 1.3 : profile.scale === "115" ? 1.15 : 1;
    root.style.fontSize = "100%";
    (root.style as any).zoom = String(factor);
    return () => {
      root.style.fontSize = previousFontSize;
      (root.style as any).zoom = previousZoom;
    };
  }, [profile.scale]);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingMagic, setSendingMagic] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  const [openSection, setOpenSection] = useState(room.sections[0]?.code ?? "01");
  const [showCover, setShowCover] = useState(true);
  const [dealScope, setDealScope] = useState<"B2B" | "B2C">("B2B");
  const [signName, setSignName] = useState("");
  const [signCompany, setSignCompany] = useState("");
  const [signCompanyType, setSignCompanyType] = useState<string>("");
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

  // Prueba de fondos (POF) desde la sala.
  const [pofStatus, setPofStatus] = useState<"none" | "declared" | "verified" | null>(null);
  const [pofEntity, setPofEntity] = useState("");
  const [pofFund, setPofFund] = useState("");
  const [pofAmount, setPofAmount] = useState("");
  const [pofNotes, setPofNotes] = useState("");
  const [pofFile, setPofFile] = useState<File | null>(null);
  const [pofBusy, setPofBusy] = useState(false);
  // Solicitud de acceso (categoría Deal Pod): nombre/empresa/consentimiento.
  const [requesterName, setRequesterName] = useState("");
  const [requesterCompany, setRequesterCompany] = useState("");
  const [accessConsent, setAccessConsent] = useState(false);
  const [pofError, setPofError] = useState<string | null>(null);
  const [pofMessage, setPofMessage] = useState<string | null>(null);

  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  
  const isProposal = room.kind === "PROPOSAL";
  const isOpenSign = Boolean(room.openSign);
  const unlocked = Boolean(initialEmail && rawToken) || isOpenSign;
  // Comentarios y anexos solo en instrumentos que lo ameritan (contratos/acuerdos).
  // Un NDA unilateral (PROPOSAL/NDA) no admite discusión ni anexos.
  const collaborative = ["AGREEMENT", "CONTRACT", "AMENDMENT", "CHARTER"].includes(room.kind);
  const signerId = isOpenSign ? (account?.address?.toLowerCase() ?? "") : (initialEmail ?? "");
  const ndaVersion = room.ndaVersion ?? "v2.2";
  const effectiveNdaEnabled = Boolean(room.ndaEnabled);

  // Dynamic party resolution for B2B vs B2C deals
  const isB2B = dealScope === "B2B";
  // Si el firmante no escribe su empresa, la parte es la contraparte de la sala.
  // Usar `room.company` aquí devolvía el nombre del PRESTADOR como si fuera el
  // cliente (p. ej. "Pandoras International" aparecía como firmante).
  const fullCompanyName = signCompany.trim()
    ? (signCompanyType && signCompanyType !== "Otra" ? `${signCompany.trim()} ${signCompanyType}` : signCompany.trim())
    : room.counterparty;

  const dynamicPartyName = isB2B
    ? fullCompanyName
    : (signName.trim() || room.counterparty);

  const resolveDynamicText = (text: string) => {
    if (!text) return "";
    // Sólo tokens explícitos: reemplazar la mención literal de la contraparte
    // reescribía nombres de personas o del activo cuando el firmante escribía
    // su empresa (p. ej. una propuesta a "Óscar Trueba" firmada por una sociedad).
    return text
      .replace(/{{COUNTERPARTY_COMPANY}}/gi, dynamicPartyName)
      .replace(/{{COUNTERPARTY}}/gi, dynamicPartyName)
      .replace(/{{REPRESENTATIVE}}/gi, signName.trim() || "por el cliente al firmar")
      .replace(/Pandora's LLC/gi, "marca Pandora's y sus servicios bajo la umbrela de MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.");
  };

  // ── NDA CHECK ON MOUNT ───────────────────────────────────────────────────
  // Estado del POF cuando el NDA ya está firmado.
  useEffect(() => {
    if (!rawToken || rawToken === "creator-preview-token") return;
    if (ndaStep !== "signed" && ndaStep !== "bypassed") return;
    let cancelled = false;
    fetch(`/api/public/deals/${publicId}/pof?token=${encodeURIComponent(rawToken)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.status) setPofStatus(data.status);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [rawToken, ndaStep, publicId]);

  /** Envío del POF. Sin compuerta: la usa tanto el formulario como la firma. */
  const sendPof = async (): Promise<boolean> => {
    if (!rawToken || !pofFile) return false;
    setPofBusy(true);
    setPofError(null);
    setPofMessage(null);
    try {
      const form = new FormData();
      form.append("token", rawToken);
      form.append("entity", pofEntity);
      form.append("fund", pofFund);
      form.append("amount", pofAmount);
      form.append("notes", pofNotes);
      form.append("file", pofFile);
      const res = await fetch(`/api/public/deals/${publicId}/pof`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPofError(data.error ?? "No se pudo enviar el documento.");
        return false;
      }
      setPofStatus("declared");
      setPofMessage("Documento recibido. Lo revisamos y te enviamos el OM al verificarlo.");
      setPofFile(null);
      return true;
    } catch {
      setPofError("Error de red al enviar el documento.");
      return false;
    } finally {
      setPofBusy(false);
    }
  };

  const submitPof = async () => {
    if (!rawToken) return;
    if (!(ndaStep === "signed" || ndaStep === "bypassed")) {
      setPofError("Primero firma el acuerdo de confidencialidad: la prueba de fondos se habilita al firmar.");
      return;
    }
    if (!pofFile) {
      setPofError("Adjunta la carta del fondo o tu declaración.");
      return;
    }
    await sendPof();
  };

  // Once we know the wallet/email, check if NDA is needed and if already signed.
  useEffect(() => {
    if (!effectiveNdaEnabled) { setNdaStep("none"); return; }
    if (rawToken === "creator-preview-token") { setNdaStep("none"); return; }
    
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
          if (data.previousAcceptance?.signatureCompany) {
            setSignCompany(data.previousAcceptance.signatureCompany);
          }
          if (data.previousAcceptance?.signatureRole) {
            setSignRole(data.previousAcceptance.signatureRole);
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
      const res = await fetch(`/api/public/deals/${publicId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: requesterName.trim() || null,
          company: requesterCompany.trim() || null,
          consent: accessConsent,
          source: "room",
          src: srcCode,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
        }),
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
      const message = buildNdaSignMessage({
        email: emailId,
        wallet: account.address.toLowerCase(),
        ndaVersion,
        timestamp: ts,
      });

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
          signatureCompany: signCompany.trim() || undefined,
          signatureRole: signRole.trim() || undefined,
          wallet: account.address,
          signature,
          timestamp: ts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar el NDA");

      setNdaSignatureHash(signature);
      setNdaStep("signed");

      // POF integrada en la firma: si el deal la pide y el firmante adjuntó su
      // carta, se envía en el mismo gesto. Nunca bloquea la firma.
      if (room.pofEnabled && pofFile) {
        const sent = await sendPof();
        if (!sent) {
          setPofError("El NDA quedó firmado. La prueba de fondos no se pudo enviar: puedes reintentarla abajo.");
        }
      }
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
      const companyVal = isB2B
        ? (signCompany.trim()
            ? (signCompanyType && signCompanyType !== "Otra" ? `${signCompany.trim()} ${signCompanyType}` : signCompany.trim())
            : (room.company || room.counterparty || undefined))
        : undefined;
      const roleVal = isB2B ? (signRole.trim() || "Representante Legal") : (signRole.trim() || "Titular / Individual");
      const message = usesCombined
        ? buildCombinedSignMessage({
            email: emailId,
            name,
            company: companyVal,
            role: roleVal,
            wallet: account.address.toLowerCase(),
            publicId,
            dealKind: room.kind,
            dealCounterparty: companyVal || dynamicPartyName,
            ndaVersion,
            timestamp: ts,
          })
        : buildSignMessage({
            publicId,
            kind: room.kind,
            counterparty: companyVal || dynamicPartyName,
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
    <main className="fixed inset-0 bg-[#08080A] print:static print:h-auto print:bg-white text-zinc-100 print:text-black font-sans flex flex-col overflow-hidden print:overflow-visible">
      <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#0C0C10] print:hidden border-b border-white/10 font-mono">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 shrink-0">
            <Handshake className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[15px] font-semibold text-zinc-100 tracking-tight truncate">PANDORA'S NEXUS · TRANSACTION ROOM</span>
            <p className="text-[11px] text-zinc-500 truncate">{room.publicId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => {
              const el = document.getElementById("display-controls-dropdown");
              if (el) el.classList.toggle("hidden");
            }}
            className="p-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer flex items-center"
            title="Controles Visuales"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sliders"><line x1="4" x2="20" y1="21" y2="14"/><line x1="4" x2="20" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="2" x2="22" y1="14" y2="14"/><line x1="2" x2="22" y1="8" y2="8"/></svg>
          </button>
          
          <div id="display-controls-dropdown" className="hidden absolute top-full right-0 mt-2 z-50">
            <DisplayControlsWidget />
          </div>

          <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            CONFIDENTIAL
          </span>
        </div>
      </header>

      {/* ── GLOBAL FULL-WIDTH NDA SIGNING BANNER (PROMINENT & SPATIOUS) ────────── */}
      {unlocked && effectiveNdaEnabled && ndaStep === "required" && (
        <div className="bg-[#0D0D12] border-b border-amber-500/30 px-4 md:px-8 py-5 print:hidden shrink-0 shadow-lg shadow-black/40">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-widest bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                      PASO 1 REQUERIDO: FIRMA DE CONFIDENCIALIDAD (NDA)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">Versión {ndaVersion}</span>
                  </div>
                  <h2 className="text-[17px] font-bold text-white mt-1">
                    Acuerdo de Confidencialidad y No Divulgación Pandora's
                  </h2>
                  <p className="text-[13px] text-zinc-400 mt-0.5 leading-relaxed">
                    Para desbloquear el contenido y firmar el acuerdo de <strong className="text-zinc-200">{signCompany || room.company || room.counterparty}</strong>, la contraparte debe aceptar y firmar primero el Master NDA on-chain.
                  </p>
                </div>
              </div>

              {/* Botón ver documento completo */}
              <button
                type="button"
                onClick={() => setNdaModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-[13px] font-mono text-zinc-200 transition-colors shrink-0"
              >
                <FileSignature className="w-4 h-4 text-amber-300" />
                LEER ACUERDO COMPLETO (PDF)
              </button>
            </div>

            {/* POF integrada en la firma (sólo si el deal la activó) */}
            {room.pofEnabled && (
              <div className="mt-3 rounded-xl border border-sky-500/25 bg-sky-500/[0.04] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-sky-300">
                    Prueba de fondos (POF)
                  </p>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                    Opcional ahora
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
                  La necesitamos para entregarte el OM. Puedes adjuntarla ahora y se envía junto con tu
                  firma, o dejarla para después.
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    value={pofEntity}
                    onChange={(event) => setPofEntity(event.target.value.slice(0, 200))}
                    placeholder="Ej. Inversiones del Pacífico, S.A.P.I."
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
                  />
                  <input
                    value={pofFund}
                    onChange={(event) => setPofFund(event.target.value.slice(0, 200))}
                    placeholder="Ej. Pacífico Capital Fund II"
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
                  />
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select
                    value={pofAmount}
                    onChange={(event) => setPofAmount(event.target.value)}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-sky-500/40"
                  >
                    <option value="">Rango de inversión</option>
                    <option value="<50M">Menos de USD 50M</option>
                    <option value="50-150M">USD 50–150M</option>
                    <option value="150-300M">USD 150–300M</option>
                    <option value=">300M">Más de USD 300M</option>
                  </select>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(event) => setPofFile(event.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-sky-500/20 file:px-3 file:py-1 file:text-[10px] file:font-mono file:uppercase file:tracking-wider file:text-sky-200"
                  />
                </div>
                <textarea
                  value={pofNotes}
                  onChange={(event) => setPofNotes(event.target.value.slice(0, 1000))}
                  rows={2}
                  placeholder="Ej. Carta del fondo emitida el 18 nov; fondos disponibles en 10 días hábiles."
                  className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
                />
                {pofFile && (
                  <p className="mt-1.5 text-[11px] text-sky-200">
                    Adjunto: {pofFile.name} · se enviará al firmar
                  </p>
                )}
                {pofError && <p className="mt-1.5 text-[11px] text-rose-300">{pofError}</p>}
              </div>
            )}

            {/* Checkbox and Sign Button Row */}
            <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label 
                onClick={() => setNdaChecked(!ndaChecked)}
                className="flex items-center gap-3 cursor-pointer text-[13px] text-zinc-300 select-none"
              >
                <div
                  className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors cursor-pointer
                    ${ndaChecked ? "bg-amber-500 border-amber-500" : "border-white/20 bg-black/30 hover:border-amber-500/50"}`}
                >
                  {ndaChecked && <Check className="w-2.5 h-2.5 text-black" />}
                </div>
                <span>
                  He leído y acepto los términos del <strong className="text-amber-300">Master NDA {ndaVersion}</strong> en representación de <strong className="text-white">{signCompany || room.company || room.counterparty}</strong>.
                </span>
              </label>

              <div className="flex items-center gap-3 shrink-0">
                {!account ? (
                  <ConnectButton
                    client={client}
                    wallets={signerWallets}
                    connectButton={{ label: "Conectar Wallet para firmar NDA" }}
                    connectModal={{ size: "compact", title: "Verificar identidad", showThirdwebBranding: false }}
                    theme={darkTheme({ colors: { primaryButtonBg: "#f59e0b", primaryButtonText: "#000" } })}
                  />
                ) : (
                  <button
                    onClick={handleSignNdaOnly}
                    disabled={!ndaChecked || signingNda}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-[13px] hover:bg-amber-400 transition-colors disabled:opacity-40 font-mono tracking-wider uppercase shadow-lg shadow-amber-500/10"
                  >
                    {signingNda ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        FIRMANDO ON-CHAIN...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        FIRMAR NDA ON-CHAIN ({account.address.slice(0, 6)}...{account.address.slice(-4)})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {unlocked ? (
        <div className="flex-1 flex flex-col md:flex-row min-h-0 print:block overflow-y-auto md:overflow-hidden">
          {showCover ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#08080A] to-[#121217] text-center print:hidden relative overflow-hidden min-h-[100dvh] md:min-h-0">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
              
              <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center mb-8 shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]">
                  <Handshake className="w-8 h-8 text-amber-400" />
                </div>
                
                <h4 className="text-[12px] font-mono text-amber-500/80 tracking-widest uppercase mb-3">
                  {KIND_LABEL[room.kind]} · {room.relation}
                </h4>
                
                <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight leading-tight mb-4">
                  {room.summary || KIND_LABEL[room.kind]}
                </h1>
                
                <p className="text-[15px] text-zinc-400 mb-10 max-w-md">
                  Preparado exclusivamente para <span className="text-zinc-200 font-medium">{dynamicPartyName}</span>. Este documento se encuentra asegurado criptográficamente bajo la jurisdicción soberana de Pandora's.
                </p>
                
                <button
                  onClick={() => setShowCover(false)}
                  className="group flex items-center gap-3 px-8 py-4 rounded-full bg-amber-500 text-black font-semibold text-[15px] hover:bg-amber-400 transition-all shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_0px_rgba(245,158,11,0.6)] hover:-translate-y-0.5"
                >
                  INICIAR LECTURA
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-zinc-500" /> Sovereign Deal Room Protocol
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 md:overflow-y-auto p-4 md:p-8 print:py-12 print:px-8 print:overflow-visible">
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
                  <a
                    href={`/api/public/deals/${publicId}/pdf`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-[12px] font-mono text-zinc-300 transition-colors print:hidden"
                  >
                    <Download className="w-3.5 h-3.5" />
                    DESCARGAR PDF
                  </a>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white print:text-black print:text-4xl print:mt-4 print:mb-8 tracking-tight">
                {room.summary || KIND_LABEL[room.kind]}
              </h1>

              {room.cognitiveSummary && room.cognitiveSummary.length > 0 && (
                <div className="mt-6 mb-2 p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.04] relative overflow-hidden group print:hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors"></div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-8 h-8 rounded-lg border border-indigo-500/40 bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-indigo-300 font-mono tracking-widest uppercase mb-1 flex items-center gap-2">
                        Hermes Cognitive Summary
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[8px] leading-none">AI GENERATED</span>
                      </h3>
                      <p className="text-[14px] text-zinc-300 leading-relaxed mb-3">
                        He analizado este acuerdo. Los puntos críticos para <strong className="text-zinc-100">{dynamicPartyName}</strong> son:
                      </p>
                      <ul className="space-y-2">
                        {room.cognitiveSummary.map((point, idx) => {
                          const parts = point.split(/(\*\*.*?\*\*)/g);
                          return (
                            <li key={idx} className="flex items-start gap-2 text-[13px] text-zinc-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                              <span>
                                {parts.map((p, j) => {
                                  if (p.startsWith("**") && p.endsWith("**")) {
                                    return <strong key={j} className="text-zinc-200 font-semibold">{p.slice(2, -2)}</strong>;
                                  }
                                  return <span key={j}>{p}</span>;
                                })}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 mb-4 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                    {isB2B ? "Contraparte B2B:" : "Contraparte Individual (B2C):"}
                  </span>
                  <p className="text-[15px] font-bold text-white print:text-black">{dynamicPartyName}</p>
                </div>
                {isB2B && signName.trim() && (
                  <p className="text-[11px] font-mono text-zinc-500 mt-1 print:text-black">
                    Representante Legal (registro interno / firma): <span className="text-zinc-300">{signName}</span> {signRole ? `(${signRole})` : ""}
                  </p>
                )}
              </div>

              {/* ── ACTIVE NDA BADGE ──────────────────────────────────── */}
              {effectiveNdaEnabled && (ndaStep === "signed" || ndaStep === "bypassed") && (
                <div className="mb-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] flex items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                    <div>
                      <p className="text-[12px] font-mono text-emerald-300 font-semibold">Acuerdo de Confidencialidad (NDA {ndaVersion}) Activo</p>
                      <p className="text-[11px] text-zinc-400">Protección legal y evidencia criptográfica verificada on-chain.</p>
                    </div>
                  </div>
                  <a
                    href={`/api/public/deals/${publicId}/nda/pdf`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-[11px] font-mono hover:bg-emerald-500/20 transition-colors shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    DESCARGAR NDA (PDF)
                  </a>
                </div>
              )}

              {unlocked && room.pofEnabled && (ndaSigned || ndaStep === "signed") && rawToken && rawToken !== "creator-preview-token" && (
                <div className="mb-4 rounded-xl border border-sky-500/25 bg-sky-500/[0.04] p-4 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-sky-300">
                      Prueba de fondos (POF)
                    </p>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                        pofStatus === "verified"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : pofStatus === "declared"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-white/10 bg-white/5 text-zinc-400"
                      }`}
                    >
                      {pofStatus === "verified" ? "Verificado" : pofStatus === "declared" ? "En revisión" : "Pendiente"}
                    </span>
                  </div>

                  {pofStatus === "verified" ? (
                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
                      Fondos verificados. El memorándum de inversión se envía a tu correo con un enlace personal.
                    </p>
                  ) : pofStatus === "declared" ? (
                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
                      Documento recibido y en revisión. Al verificarlo recibirás el OM por correo.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p className="text-[12px] leading-relaxed text-zinc-500">
                        Para acceder al OM necesitamos tu declaración y la carta del fondo (o equivalente).
                        Puedes subir un PDF o imagen de hasta 5 MB.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={pofEntity}
                          onChange={(event) => setPofEntity(event.target.value.slice(0, 200))}
                          placeholder="Ej. Inversiones del Pacífico, S.A.P.I."
                          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
                        />
                        <input
                          value={pofFund}
                          onChange={(event) => setPofFund(event.target.value.slice(0, 200))}
                          placeholder="Ej. Pacífico Capital Fund II"
                          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
                        />
                      </div>
                      <select
                        value={pofAmount}
                        onChange={(event) => setPofAmount(event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-sky-500/40"
                      >
                        <option value="">Rango de inversión</option>
                        <option value="<50M">Menos de USD 50M</option>
                        <option value="50-150M">USD 50–150M</option>
                        <option value="150-300M">USD 150–300M</option>
                        <option value=">300M">Más de USD 300M</option>
                      </select>
                      <textarea
                        value={pofNotes}
                        onChange={(event) => setPofNotes(event.target.value.slice(0, 1000))}
                        rows={2}
                        placeholder="Ej. Carta del fondo emitida el 18 nov; fondos disponibles en 10 días hábiles."
                        className="w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
                      />
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(event) => setPofFile(event.target.files?.[0] ?? null)}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-sky-500/20 file:px-3 file:py-1 file:text-[11px] file:font-mono file:uppercase file:tracking-wider file:text-sky-200"
                      />
                      <button
                        type="button"
                        onClick={() => void submitPof()}
                        disabled={pofBusy || !(ndaStep === "signed" || ndaStep === "bypassed")}
                        className="w-full rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-sky-200 hover:bg-sky-500/20 disabled:opacity-50"
                      >
                        {pofBusy ? "Enviando…" : "Enviar prueba de fondos"}
                      </button>
                      {pofError && <p className="text-[11px] text-rose-300">{pofError}</p>}
                      {pofMessage && <p className="text-[11px] text-emerald-300">{pofMessage}</p>}
                    </div>
                  )}
                </div>
              )}

              {isProposal && (
                <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.06]">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-blue-300 mb-1">Documento de trabajo · No vinculante</p>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    Este documento representa una propuesta inicial de colaboración y sirve como base para conversación,
                    retroalimentación y construcción conjunta del modelo definitivo. No constituye un acuerdo formal.
                  </p>
                </div>
              )}

              {room.enteredIntoForceAt && (
                <div className="mt-4 p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07]">
                  <p className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-emerald-300 mb-1">
                    <Check className="w-3.5 h-3.5" /> Acuerdo legítimo en vigor
                  </p>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
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
                  <p className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-violet-300 mb-1">
                    <FileSignature className="w-3.5 h-3.5" /> Siguiente Documento Disponible
                  </p>
                  <p className="text-[12px] text-zinc-400 leading-relaxed mb-3">
                    El <span className="text-violet-200 font-semibold">{room.nextRoomKindLabel}</span> ha sido desbloqueado como seguimiento de este acuerdo.
                    Está listo para revisión y firma.
                  </p>
                  <a
                    href={`/deal/${room.nextRoomPublicId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-200 text-[13px] font-semibold hover:bg-violet-500/30 transition-colors"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    Abrir {room.nextRoomKindLabel}
                  </a>
                </div>
              )}

              {room.summary && (
                <p className="mt-4 text-[13px] text-zinc-400 print:text-black leading-relaxed">{room.summary}</p>
              )}
            </div>

            {/* ── DOCUMENT CLAUSES OR NDA GATE ────────────────────────── */}
            {effectiveNdaEnabled && ndaStep === "required" ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-8 text-center my-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-300">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Documento Confidencial Protegido por NDA</h2>
                <p className="text-[15px] text-zinc-400 max-w-lg mx-auto leading-relaxed mb-6">
                  Para acceder y revisar las cláusulas de este acuerdo B2B ({room.summary || KIND_LABEL[room.kind]}), es obligatorio firmar previamente el Acuerdo de Confidencialidad y No Uso (NDA) de Pandora's Ecosystem.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/30 text-[13px] font-mono">
                  <ShieldCheck className="w-4 h-4" /> Firma el NDA en el panel lateral para desbloquear este documento
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {room.sections.map((sec, sectionIndex) => (
                  <div key={sec.code} className="deal-section rounded-xl border border-white/10 bg-[#0C0C10] overflow-hidden print:border-none print:bg-transparent">
                    <button
                      onClick={() => setOpenSection(openSection === sec.code ? "" : sec.code)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="flex items-center gap-3 print:mb-4">
                        <span className="text-[11px] font-mono text-amber-300/80 print:text-black print:text-lg print:font-bold">{sec.code}.</span>
                        <span className="text-[14px] text-zinc-100 print:text-black print:text-lg print:font-bold">
                          {resolveDynamicText(sec.title)}
                        </span>
                      </span>
                      <span className={`text-zinc-600 print:hidden transition-transform ${openSection === sec.code ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    <div className={`px-4 pb-4 space-y-1.5 ${openSection === sec.code ? "block" : "hidden print:block"}`}>
                        {(() => {
                          let inCodeBlock = false;
                          return sec.content.split("\n").map((line, i) => {
                            if (!line && !inCodeBlock) return null;
                            const renderedLine = resolveDynamicText(line);

                            if (renderedLine.trim().startsWith("```")) {
                              inCodeBlock = !inCodeBlock;
                              return (
                                <p key={i} className="text-[13px] text-zinc-500 font-mono leading-relaxed mb-1">
                                  <span className="text-zinc-600 print:hidden font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                                  {renderedLine}
                                </p>
                              );
                            }

                            if (inCodeBlock) {
                              return (
                                <p key={i} className="text-[13px] text-zinc-400 font-mono whitespace-pre print:text-black leading-relaxed mb-1 overflow-x-auto">
                                  <span className="text-zinc-600 print:text-black font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                                  {renderedLine}
                                </p>
                              );
                            }

                            if (renderedLine.startsWith("## ")) {
                              return <h2 key={i} className="text-[16px] font-bold text-white print:text-black mt-4 mb-2">{renderedLine.slice(3)}</h2>;
                            }
                            if (renderedLine.startsWith("### ")) {
                              return <h3 key={i} className="text-[14px] font-semibold text-amber-200 print:text-black mt-3 mb-1">{renderedLine.slice(4)}</h3>;
                            }

                            const parts = renderedLine.split(/(\*\*.*?\*\*)/g);
                            return (
                              <p key={i} className="text-[13px] text-zinc-300 print:text-black leading-relaxed mb-2">
                                <span className="text-zinc-600 print:hidden font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                                {parts.map((p, j) => {
                                  if (p.startsWith("**") && p.endsWith("**")) {
                                    return <strong key={j} className="text-white print:text-black font-semibold">{p.slice(2, -2)}</strong>;
                                  }
                                  return <span key={j}>{p}</span>;
                                })}
                              </p>
                            );
                          });
                        })()}
                        {unlocked && collaborative && (
                          <div className="print:hidden">
                            <DealComments publicId={publicId} sectionCode={sec.code} rawToken={rawToken} />
                          </div>
                        )}
                        
                        {/* Next Button */}
                        {(() => {
                          const nextSec = room.sections[sectionIndex + 1];
                          if (!nextSec) return null;
                          return (
                            <button
                              onClick={() => {
                                setOpenSection(nextSec.code);
                              }}
                              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[12px] font-mono hover:bg-amber-500/20 transition-colors shadow-sm print:hidden"
                            >
                              SIGUIENTE: {nextSec.title} <ChevronDown className="w-4 h-4" />
                            </button>
                          );
                        })()}
                      </div>
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
                    <h3 className="text-[15px] font-semibold text-emerald-200">Aceptación Criptográfica B2B Verificada</h3>
                    <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">
                      El presente documento ha sido aceptado electrónicamente y firmado on-chain en representación de <strong>{signCompany || room.company || room.counterparty}</strong> por <strong>{signName || account?.address}</strong> ({signRole || "Representante Legal"}).
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {room.signers && room.signers.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/10 print:border-black/20">
                <h3 className="text-[15px] font-semibold text-white print:text-black mb-4 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-amber-500" />
                  Estado de Firmas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {room.signers.map((s, i) => (
                    <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] print:border-black/10 print:bg-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-medium text-white print:text-black">
                          {s.signatureName || s.wallet || "Pendiente"}
                        </span>
                        {s.status === "SIGNED" ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 print:text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                            <Check className="w-3 h-3" /> Firmado
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded">
                            Pendiente
                          </span>
                        )}
                      </div>
                      {s.signatureRole && s.signatureCompany && (
                        <p className="text-[11px] text-zinc-400 print:text-black mt-1">
                          {s.signatureRole} en {s.signatureCompany}
                        </p>
                      )}
                      {s.wallet && (
                        <p className="text-[11px] font-mono text-zinc-500 print:text-zinc-600 mt-2 break-all [overflow-wrap:anywhere]">
                          Wallet: {s.wallet}
                        </p>
                      )}
                      {s.signedAt && (
                        <p className="text-[9px] font-mono text-zinc-600 print:text-zinc-500 mt-1">
                          {new Date(s.signedAt).toLocaleString()}
                        </p>
                      )}
                      {s.signature && (
                        <p className="text-[9px] font-mono text-emerald-400/80 print:text-emerald-600 mt-1 break-all [overflow-wrap:anywhere]" title={s.signature}>
                          Sig: {s.signature}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <NDAModal
            isOpen={ndaModalOpen}
            onClose={() => setNdaModalOpen(false)}
            version={ndaVersion}
            publicId={publicId}
          />
          </div>
          )}

          {/* Sidebar / Sign Box */}
          <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-white/10 p-4 md:p-6 bg-[#08080A] print:hidden flex flex-col md:overflow-y-auto">
          <div className="max-w-sm mx-auto md:mx-0">
            {signed ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] text-center">
                <Check className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
                <h3 className="text-[15px] font-semibold text-emerald-200">¡Acuerdo B2B Firmado!</h3>
                <p className="text-[12px] text-zinc-400 mt-2 leading-relaxed">
                  Tu aceptación quedó registrada en el audit trail del Deal Room. Gracias por tu confianza.
                </p>
                <a
                  href={`/api/public/deals/${publicId}/pdf`}
                  download
                  className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 text-[12px] font-mono hover:bg-emerald-500/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  DESCARGAR ACUERDO (PDF)
                </a>
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
                      <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-300">Identidad verificada</p>
                      <p className="text-[11px] text-zinc-400 truncate">{initialEmail}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
                      <FileSignature className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-amber-300">Firma online habilitada</p>
                      <p className="text-[11px] text-zinc-400">No se requiere correo · firma on-chain verificada</p>
                    </div>
                  </div>
                )}

                {/* ── PASO 1: NDA REQUIREMENT & SIGNING ─────────────────── */}
                {effectiveNdaEnabled && ndaStep === "loading" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-black/30">
                    <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin shrink-0" />
                    <p className="text-[12px] text-zinc-500">Verificando estado del NDA…</p>
                  </div>
                )}

                {/* ── PASO 1 PENDIENTE (SIDEBAR HELPER) ───────────────── */}
                {effectiveNdaEnabled && ndaStep === "required" && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                      <div>
                        <p className="text-[12px] font-mono uppercase tracking-widest text-amber-300 font-bold">Paso 1: NDA Requerido</p>
                        <p className="text-[11px] text-zinc-400">Firma en el panel superior</p>
                      </div>
                    </div>

                    <p className="text-[12px] text-zinc-400 leading-relaxed">
                      El <strong className="text-zinc-200">Acuerdo de Confidencialidad ({ndaVersion})</strong> debe ser firmado en el panel superior para desbloquear la firma de este acuerdo.
                    </p>

                    <button
                      type="button"
                      onClick={() => setNdaModalOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-white/10 rounded-lg text-[11px] text-zinc-300 hover:bg-white/5 transition-colors uppercase tracking-widest font-mono"
                    >
                      <FileSignature className="w-3.5 h-3.5 text-amber-400" />
                      Ver Master NDA Completo
                    </button>
                  </div>
                )}

                {/* ── PASO 2: AGREEMENT SIGNING FORM ───────────────────── */}
                {(!effectiveNdaEnabled || ndaStep === "signed" || ndaStep === "bypassed" || ndaStep === "none") && (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-[15px] font-semibold text-white">
                        {isProposal
                          ? isB2B ? "Aceptar propuesta B2B" : "Aceptar propuesta Individual"
                          : isB2B ? "Firmar acuerdo B2B" : "Firmar acuerdo Individual"}
                      </h3>
                    </div>

                    {/* Selector B2B / B2C */}
                    <div className="flex rounded-lg border border-white/10 bg-black/40 p-1 mb-3">
                      <button
                        type="button"
                        onClick={() => setDealScope("B2B")}
                        className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-mono transition-all ${
                          dealScope === "B2B"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        🏢 Empresa / B2B
                      </button>
                      <button
                        type="button"
                        onClick={() => setDealScope("B2C")}
                        className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-mono transition-all ${
                          dealScope === "B2C"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        👤 Persona Física / B2C
                      </button>
                    </div>

                    <p className="text-[12px] text-zinc-500 leading-relaxed mb-3">
                      {isB2B
                        ? "Ingresa los datos de tu empresa y representación legal para firmar on-chain."
                        : "Ingresa tus datos personales para firmar on-chain como persona física."}
                    </p>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                      {isB2B && (
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                            Empresa / Razón Social *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                placeholder="Nombre de la empresa"
                                value={signCompany}
                                onChange={(e) => setSignCompany(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                              />
                            </div>
                            <div>
                              <select
                                value={signCompanyType}
                                onChange={(e) => setSignCompanyType(e.target.value)}
                                className="w-full bg-[#0C0C10] border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-zinc-200 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                              >
                                {COMPANY_TYPES.map((t) => (
                                  <option key={t.value} value={t.value} className="bg-[#0C0C10] text-zinc-200">
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <p className="text-[9px] text-zinc-500 mt-1">
                            Razón social B2B: <strong className="text-zinc-300">{fullCompanyName}</strong>
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          {isB2B ? "Nombre del Representante Legal *" : "Nombre Completo (Persona Física) *"}
                        </label>
                        <input
                          type="text"
                          placeholder="Tu nombre y apellidos"
                          value={signName}
                          onChange={(e) => setSignName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                        />
                        <p className="text-[9px] text-zinc-500 mt-1">
                          {isB2B
                            ? "Para registro interno y firma on-chain (la empresa figura como la entidad contratante)."
                            : "Nombre que figurará formalmente en el acuerdo y registro de firma on-chain."}
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          {isB2B ? "Cargo o Poder Legal *" : "Rol o Calidad (Opcional)"}
                        </label>
                        <input
                          type="text"
                          placeholder={isB2B ? "Ej: Representante Legal / Director General" : "Ej: Inversionista / Colaborador / Titular"}
                          value={signRole}
                          onChange={(e) => setSignRole(e.target.value)}
                          className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                        />
                      </div>
                      
                      {signName.trim() && (
                        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] text-[12px] text-amber-200/80 leading-relaxed">
                          {isB2B ? (
                            <>Firmarás como: <strong className="text-amber-300 not-italic">{signName}</strong> ({signRole || "Representante"}) en representación formal de <strong className="text-amber-300 not-italic">{fullCompanyName}</strong></>
                          ) : (
                            <>Firmarás como persona física: <strong className="text-amber-300 not-italic">{signName}</strong> {signRole ? `(${signRole})` : ""}</>
                          )}
                        </div>
                      )}

                      {account?.address ? (
                        expectedWallet && account.address.toLowerCase() !== expectedWallet.toLowerCase() ? (
                          <div className="flex flex-col gap-2 px-3 py-2.5 rounded-lg border border-rose-500/40 bg-rose-500/[0.06]">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[9px] font-mono uppercase tracking-widest text-rose-400">Cuenta incorrecta</p>
                                <p className="text-[11px] font-mono text-zinc-300 truncate">{account.address}</p>
                              </div>
                            </div>
                            <p className="text-[11px] text-rose-300/80 leading-relaxed">
                              Esta sesión está vinculada a otra cuenta (<span className="font-mono text-rose-200">{expectedWallet.slice(0,6)}...{expectedWallet.slice(-4)}</span>). No puedes proceder con una cuenta diferente.
                            </p>
                            <button
                              type="button"
                              onClick={() => { if (activeWallet) disconnect(activeWallet); }}
                              className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-200 text-[12px] font-mono transition-colors"
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
                                <p className="text-[11px] font-mono text-zinc-300 truncate">{account.address}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { if (activeWallet) disconnect(activeWallet); }}
                              className="text-[11px] font-mono text-emerald-400/70 hover:text-emerald-300 transition-colors underline decoration-emerald-400/30 underline-offset-2 shrink-0"
                            >
                              Salir
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                          <p className="text-[11px] text-zinc-500 mb-2">Conecta tu wallet para firmar el acuerdo (gratis · sin gas):</p>
                          <ConnectButton
                            client={client}
                            wallets={signerWallets}
                            connectButton={{ label: "Conectar y firmar" }}
                            connectModal={{ size: "compact", title: "Verificar identidad", showThirdwebBranding: false }}
                            theme={darkTheme({ colors: { primaryButtonBg: "#10b981", primaryButtonText: "#000" } })}
                          />
                        </div>
                      )}

                      {signError && <p className="text-[12px] text-rose-400">{signError}</p>}
                      <button
                        type="button"
                        onClick={handleSign}
                        disabled={
                          signing ||
                          !signName.trim() ||
                          (isB2B && !signCompany.trim()) ||
                          !account?.address ||
                          (!!expectedWallet && account.address.toLowerCase() !== expectedWallet.toLowerCase())
                        }
                        className={SIGN_BUTTON_STYLE}
                      >
                        {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
                        {signing ? "FIRMANDO..." : isProposal ? `ACEPTAR PROPUESTA (${dealScope})` : `FIRMAR ACUERDO (${dealScope})`}
                      </button>
                    </form>
                    <p className="text-[9px] text-zinc-600 mt-1 text-center leading-relaxed">
                      Firma on-chain verificada (EIP-191) · gratis, sin gas · audit trail inmutable
                    </p>
                  </>
                )}
                
                {/* ── ATTACHMENTS (solo instrumentos colaborativos) ──────── */}
                {collaborative && <DealAttachments publicId={publicId} rawToken={rawToken} />}
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
                  <p className="text-[11px] font-mono uppercase tracking-widest text-amber-300">Acceso protegido</p>
                  <p className="text-[11px] text-zinc-500 truncate">{room.publicId}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  {KIND_LABEL[room.kind]}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white mb-1">Documento confidencial</h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed mb-5">
                Este documento está restringido. Si ya tienes acceso, recibirás tu enlace personal; si es tu
                primera vez, registramos tu solicitud y la revisamos antes de abrir la sala.
              </p>

              {emailSent ? (
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                  <Check className="w-5 h-5 text-amber-300 mb-2" />
                  <p className="text-[13px] text-amber-200">Solicitud recibida</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Si tu correo ya está autorizado, el enlace va en camino. Si es tu primera solicitud,
                    la revisamos y te escribimos. El enlace es personal y expira en 7 días.
                  </p>
                </div>
              ) : (
                <form onSubmit={requestMagic} className="space-y-3">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      placeholder="Nombre y apellidos"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value.slice(0, 120))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                    />
                    <input
                      placeholder="Empresa o vehículo"
                      value={requesterCompany}
                      onChange={(e) => setRequesterCompany(e.target.value.slice(0, 120))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accessConsent}
                      onChange={(e) => setAccessConsent(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-black/40"
                    />
                    <span>
                      Autorizo a AZTECAZ a registrar esta solicitud y a contactarme por este correo.
                    </span>
                  </label>
                  {magicError && <p className="text-[12px] text-rose-400">{magicError}</p>}
                  <button
                    type="submit"
                    disabled={sendingMagic || !email.includes("@") || !accessConsent}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[13px] font-mono transition-colors disabled:opacity-50"
                  >
                    {sendingMagic ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    SOLICITAR ACCESO
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      )}

      <footer className="h-9 shrink-0 flex items-center justify-center px-4 bg-[#0C0C10] border-t border-white/10 font-mono text-[11px] text-zinc-600">
        Pandoras Group · Confidential · Transaction Room {room.publicId}
      </footer>
    </main>
  );
}
