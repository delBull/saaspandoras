"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Handshake, Lock, Mail, Check, FileSignature, Loader2 } from "lucide-react";

interface PublicSection {
  code: string;
  title: string;
  subtitle: string;
  content: string;
}

interface PublicRoom {
  publicId: string;
  kind: "PROPOSAL" | "AGREEMENT" | "CONTRACT" | "AMENDMENT";
  counterparty: string;
  relation: string;
  company: string;
  status: string;
  summary?: string | null;
  sections: PublicSection[];
}

const KIND_LABEL: Record<PublicRoom["kind"], string> = {
  PROPOSAL: "Propuesta de Colaboración",
  AGREEMENT: "Acuerdo",
  CONTRACT: "Contrato",
  AMENDMENT: "Enmienda",
};

interface Props {
  publicId: string;
  room: PublicRoom;
  initialEmail: string | null;
  rawToken: string | null;
}

export default function DealSignerClient({ publicId, room, initialEmail, rawToken }: Props) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingMagic, setSendingMagic] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  const [openSection, setOpenSection] = useState(room.sections[0]?.code ?? "01");
  const [signName, setSignName] = useState("");
  const [signWallet, setSignWallet] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const isProposal = room.kind === "PROPOSAL";

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

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signName.trim() || !rawToken) return;
    setSigning(true);
    setSignError(null);
    try {
      const res = await fetch(`/api/public/deals/${publicId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rawToken, name: signName, wallet: signWallet }),
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
    <main className="min-h-screen bg-[#08080A] text-zinc-100 font-sans flex flex-col">
      <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#0C0C10] border-b border-white/10 font-mono">
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

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Document */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  {KIND_LABEL[room.kind]}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-white/10 bg-black/40 text-zinc-400">
                  {room.relation}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                {room.counterparty}
              </h1>
              <p className="text-[11px] font-mono text-zinc-500 mt-1">{room.company}</p>

              {isProposal && (
                <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.06]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-blue-300 mb-1">Documento de trabajo · No vinculante</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Este documento representa una propuesta inicial de colaboración y sirve como base para conversación,
                    retroalimentación y construcción conjunta del modelo definitivo. No constituye un acuerdo formal.
                  </p>
                </div>
              )}

              {room.summary && (
                <p className="mt-4 text-[12px] text-zinc-400 leading-relaxed">{room.summary}</p>
              )}
            </div>

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
                        <p key={i} className="text-[12px] text-zinc-300 leading-relaxed">
                          <span className="text-zinc-600 font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side action panel */}
        <aside className="shrink-0 w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-white/10 bg-[#0C0C10] p-5">
          <div className="max-w-sm mx-auto md:mx-0">
            {signed ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] text-center">
                <Check className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-emerald-200">¡Documento Firmado!</h3>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  Tu aceptación quedó registrada en el audit trail del Deal Room. Gracias por tu confianza.
                </p>
              </motion.div>
            ) : initialEmail && rawToken ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">Identidad verificada</p>
                    <p className="text-[10px] text-zinc-400 truncate">{initialEmail}</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1">
                  {isProposal ? "Aceptar y confirmar" : "Firmar documento"}
                </h3>
                <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                  {isProposal
                    ? "Confirma que has leído la propuesta y estás de acuerdo con su contenido para continuar la colaboración."
                    : "Ingresa tu nombre completo y (opcional) tu wallet para firmar este documento."}
                </p>

                <form onSubmit={handleSign} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                  />
                  <input
                    type="text"
                    placeholder="Wallet (0x...) · opcional"
                    value={signWallet}
                    onChange={(e) => setSignWallet(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                  />
                  {signError && <p className="text-[11px] text-rose-400">{signError}</p>}
                  <button
                    type="submit"
                    disabled={signing || !signName.trim()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[12px] font-mono transition-colors disabled:opacity-50"
                  >
                    {signing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSignature className="w-3.5 h-3.5" />}
                    {isProposal ? "ACEPTAR PROPUESTA" : "FIRMAR DOCUMENTO"}
                  </button>
                </form>
                <p className="text-[9px] text-zinc-600 mt-3 text-center leading-relaxed">
                  Firma registrada como concepto (pending-esign) · audit trail inmutable
                </p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
                    <Lock className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">Acceso protegido</p>
                    <p className="text-[10px] text-zinc-500">Por email</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1">Acceso para firmantes</h3>
                <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                  Este documento es personal y confidencial. Ingresa tu correo electrónico: si estás autorizado,
                  recibirás un enlace único de acceso.
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
            )}
          </div>
        </aside>
      </div>

      <footer className="h-9 shrink-0 flex items-center justify-center px-4 bg-[#0C0C10] border-t border-white/10 font-mono text-[10px] text-zinc-600">
        Pandoras Group · Confidential · Transaction Room {room.publicId}
      </footer>
    </main>
  );
}
