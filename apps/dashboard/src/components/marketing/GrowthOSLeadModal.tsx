"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Zap, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface GrowthOSLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName?: string;
  source?: string;
}

const TOTAL_SLOTS = 50;
const FALLBACK_REMAINING = 44; // 50 - 6 seed

export function GrowthOSLeadModal({ isOpen, onClose, tierName, source }: GrowthOSLeadModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic slot counter — fetches real lead count, refetches after submission
  const { data: slotsData, mutate: refetchSlots } = useSWR<{ remaining: number }>(
    isOpen ? '/api/marketing/growth-os/slots' : null,
    (url: string) => fetch(url).then(r => r.json()),
    { refreshInterval: 60000, fallbackData: { remaining: FALLBACK_REMAINING } }
  );
  const slotsRemaining = slotsData?.remaining ?? FALLBACK_REMAINING;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    monthlyLeads: "",
    moduleInterest: "solo_hermes",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) { setError("El email es obligatorio."); return; }
    setError(null);
    setIsLoading(true);

    try {
      // Determine priority intent based on company or module interest
      const isHighIntent = !!form.company || form.moduleInterest === "full_platform" || parseInt(form.monthlyLeads || "0") >= 500;
      const intent = isHighIntent ? "invest" : "explore";

      const res = await fetch("/api/v1/marketing/leads/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          name: form.name || undefined,
          phoneNumber: form.phone || undefined,
          intent,
          consent: true,
          projectId: "pandoras_access",
          origin: typeof window !== "undefined" ? window.location.href : "/growth-os",
          scope: "b2b",
          metadata: {
            tags: ["B2B_GROWTH_OS", "B2B_EARLY_ACCESS", ...(isHighIntent ? ["B2B_FULL_UNIT"] : [])],
            source: source || "growth-os-landing",
            type: "growth_os_signup",
            tier: tierName || "entry",
            company: form.company || undefined,
            monthlyLeads: form.monthlyLeads || undefined,
            moduleInterest: form.moduleInterest,
            interest: isHighIntent ? "full_unit" : "growth_os_access",
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Error al procesar tu solicitud.");
      }

      setStep("success");
      void refetchSlots();
    } catch (err: any) {
      setError(err?.message || "Algo salió mal. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep("form"); setForm({ name: "", email: "", phone: "", company: "", monthlyLeads: "", moduleInterest: "solo_hermes" }); setError(null); }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-500/10 relative"
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[60px] pointer-events-none" />

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 sm:p-10 relative z-10"
                >
                  {/* Scarcity badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                    <Flame className="w-3 h-3 text-red-500 animate-pulse" />
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">
                      Solo {slotsRemaining} slots Genesis disponibles
                    </span>
                  </div>

                  <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white mb-2 leading-tight">
                    Asegura tu<br />
                    <span className="text-emerald-400">posición Genesis</span>
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed">
                    Los primeros en entrar capturan la mayor ventaja asimétrica.
                    {tierName && <span className="block text-emerald-400/70 text-xs mt-1 uppercase tracking-widest font-black">{tierName}</span>}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Nombre"
                        className="col-span-2 sm:col-span-1 bg-zinc-900 border border-zinc-800 text-white text-sm px-4 py-3 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                      />
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="WhatsApp / Teléfono"
                        className="col-span-2 sm:col-span-1 bg-zinc-900 border border-zinc-800 text-white text-sm px-4 py-3 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email de trabajo *"
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm px-4 py-3 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />

                    {/* Module Interest Selector */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1 tracking-wider">¿Qué deseas instalar?</label>
                      <select
                        name="moduleInterest"
                        value={form.moduleInterest}
                        onChange={handleChange}
                        className="w-full bg-zinc-900 border border-zinc-800 text-sm px-4 py-3 rounded-xl text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      >
                        <option value="solo_hermes">🤖 Solo Hermes AI (Agentes Autónomos)</option>
                        <option value="growth_os">⚡ Growth OS (CRM + Automatización)</option>
                        <option value="full_platform">🏛️ Plataforma Completa Pandora's (Web3/Tokenización)</option>
                        <option value="not_sure">❓ No estoy seguro (Asesoría)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Empresa (opcional)"
                        className="bg-zinc-900 border border-zinc-800 text-white text-sm px-4 py-3 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                      />
                      <select
                        name="monthlyLeads"
                        value={form.monthlyLeads}
                        onChange={handleChange}
                        className="bg-zinc-900 border border-zinc-800 text-sm px-4 py-3 rounded-xl text-zinc-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                      >
                        <option value="">Leads/mes</option>
                        <option value="0-100">0–100</option>
                        <option value="100-500">100–500</option>
                        <option value="500-1000">500–1,000</option>
                        <option value="1000+">+1,000</option>
                      </select>
                    </div>

                    {error && (
                      <p className="text-red-400 text-xs font-bold px-1">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[13px] uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Asegurar Acceso Genesis
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-zinc-700 text-[10px] text-center mt-4 font-bold uppercase tracking-widest">
                    Sin spam. Sin compromisos. Solo ventaja asimétrica.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-8 sm:p-10 text-center relative z-10"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white mb-3">
                    ¡Solicitud Recibida!
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    Tu lugar ha sido reservado. Nuestro equipo revisará la información de tu organización y te contactará directamente para coordinar la demostración y habilitación de tu entorno.
                  </p>

                  <button
                    onClick={handleClose}
                    className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    Entendido
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
