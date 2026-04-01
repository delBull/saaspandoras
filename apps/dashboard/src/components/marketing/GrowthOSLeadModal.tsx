"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Zap, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface GrowthOSLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName?: string;
}

const TOTAL_SLOTS = 50;
const FALLBACK_REMAINING = 44; // 50 - 6 seed

export function GrowthOSLeadModal({ isOpen, onClose, tierName }: GrowthOSLeadModalProps) {
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
      // Determine priority intent: if they provide company or high lead volume → invest/VIP
      const isHighIntent = !!form.company || parseInt(form.monthlyLeads || "0") >= 500;
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
          // Route this to the Growth OS project/category
          projectId: "pandoras_access",
          origin: typeof window !== "undefined" ? window.location.href : "/growth-os",
          scope: "b2b",
          metadata: {
            // Independent Growth OS tags — always prefixed B2B_ by the engine
            tags: ["B2B_GROWTH_OS", "B2B_EARLY_ACCESS", ...(isHighIntent ? ["B2B_FULL_UNIT"] : [])],
            source: "growth-os-landing",
            type: "growth_os_signup",
            tier: tierName || "entry",
            company: form.company || undefined,
            monthlyLeads: form.monthlyLeads || undefined,
            interest: isHighIntent ? "full_unit" : "growth_os_access",
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Error al procesar tu solicitud.");
      }

      setStep("success");
      // Decrement slot counter immediately in UI, then refetch real count
      void refetchSlots();
    } catch (err: any) {
      setError(err?.message || "Algo salió mal. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => { setStep("form"); setForm({ name: "", email: "", phone: "", company: "", monthlyLeads: "" }); setError(null); }, 300);
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
                        className="bg-zinc-900 border border-zinc-800 text-sm px-4 py-3 rounded-xl text-zinc-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all appearance-none"
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
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 sm:p-10 text-center relative z-10 min-h-[400px] flex flex-col items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </motion.div>

                  <h3 className="text-3xl font-black tracking-tighter uppercase italic text-white mb-3">
                    Posición <span className="text-emerald-400">asegurada</span>
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-2 max-w-xs mx-auto">
                    Tu acceso Genesis está siendo procesado. Recibirás instrucciones prioritarias en tu email.
                  </p>
                  <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">
                    No compartas este acceso — es único para tu identidad.
                  </p>

                  <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-left w-full max-w-sm">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2">Próximos pasos</p>
                    <div className="space-y-2 text-xs text-zinc-400">
                      <p className="flex items-center gap-2"><Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" /> Revisa tu email en los próximos minutos</p>
                      <p className="flex items-center gap-2"><Zap className="w-3 h-3 text-purple-400 flex-shrink-0" /> Activa tu acceso con el link exclusivo</p>
                      <p className="flex items-center gap-2"><Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" /> Conecta tu wallet para finalizar el ritual</p>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="mt-6 text-zinc-600 hover:text-zinc-400 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Cerrar
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
