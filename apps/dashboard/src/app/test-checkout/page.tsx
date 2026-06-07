'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Zap, 
  CheckSquare, 
  Square, 
  FileText,
  AlertTriangle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { ConnectButton, darkTheme } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";

// MOCK DATA PARA S'NARAI
const MOCK_PROJECT = {
  id: 'mock-snarai',
  title: "S'Narai",
  slug: "snarai",
  themeColor: "#10b981",
  logoUrl: "/images/narai.jpg",
  coverPhotoUrl: "/images/narai-cover.jpg", // Si no existe, solo renderizará un color
};

const MOCK_PHASE = {
  name: "Fundador",
  tokenPrice: 0.01, // USD mock
};

export default function TestCheckoutPage() {
  const [amount, setAmount] = useState("1");
  const [step, setStep] = useState<'checkout' | 'fast_lane'>('checkout');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalChecks, setLegalChecks] = useState({
    agreement: false,
    nature: false,
    risk: false
  });
  
  const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
  const totalCostDisplay = (safeAmount * MOCK_PHASE.tokenPrice).toFixed(2);
  const brandColor = MOCK_PROJECT.themeColor;
  
  // Fake state para la demo
  const isPhaseActive = true;
  const hasEnsuredAccess = true;
  const isCheckingAccess = false;
  const isPriceLoading = false;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 font-sans relative overflow-hidden">
      {/* Dynamic Glass Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(16,185,129,0.08)_0%,_rgba(5,5,5,1)_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-30 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-24 min-h-screen flex items-center justify-center">
        
        {/* Horizontal Container (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 w-full max-w-[1100px] items-center">
          
          {/* LEFT COLUMN: Project Context & Info */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              {/* Logo & Badge */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                  {/* Subtle glow behind logo */}
                  <div className="absolute inset-0 bg-emerald-500/20 blur-md group-hover:bg-emerald-500/40 transition-colors" />
                  <img 
                    src={MOCK_PROJECT.logoUrl} 
                    alt="S'Narai" 
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64/111/fff?text=SN' }}
                  />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-2 inline-block">
                    Acceso Prioritario
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                    {MOCK_PROJECT.title}
                  </h1>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-300">Fondo: {MOCK_PHASE.name}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                  Asegura tu participación en una de las fases exclusivas del proyecto mediante nuestra infraestructura institucional.
                </p>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
                  <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> VENTA ACTIVA
                  </h4>
                  <p className="text-[10px] text-emerald-400/80 font-medium leading-tight">Condiciones preferentes habilitadas.</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mb-1">Registro Inmutable</h4>
                      <p className="text-[10px] text-zinc-500 leading-tight">Participación asegurada on-chain.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mt-4">
                <h4 className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Aviso Legal
                </h4>
                <p className="text-[10px] text-red-400/80 font-medium leading-relaxed">
                  Los Certificados son instrumentos de participación digital. NO representan propiedad inmobiliaria directa, acciones societarias ni rendimientos garantizados.
                </p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Interactive Glassmorphism Form */}
          <div className="lg:col-span-7 relative">
            {/* Background Glow for Panel */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_-20px_rgba(16,185,129,0.3)] p-6 md:p-8 overflow-hidden"
              >
                {/* Subtle top glare */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="space-y-6">
                  {/* Amount Selector */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-black/40 rounded-3xl p-5 border border-white/5 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Inversión Estimada</span>
                      <span className="text-3xl font-black text-white font-mono flex items-center gap-2">
                        {totalCostDisplay} USDC
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                      <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 block mb-1">Unidades</span>
                      <div className="flex items-center justify-between md:justify-end gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 w-full md:w-auto">
                        <button
                          onClick={() => setAmount(prev => String(Math.max(1, Number(prev) - 1)))}
                          className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-lg"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-16 bg-transparent text-white font-bold text-xl text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => setAmount(prev => String(Number(prev) + 1))}
                          className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Action Area */}
                  <div className="space-y-4 pt-2">
                    {!isLegalModalOpen ? (
                      <button
                        onClick={() => setIsLegalModalOpen(true)}
                        className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs border-none bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)]"
                      >
                        Continuar con la Participación
                      </button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-5"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400" /> Validación Legal
                          </h3>
                          <button onClick={() => setIsLegalModalOpen(false)} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">Cerrar</button>
                        </div>
                        
                        <div className="space-y-4">
                          <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, agreement: !prev.agreement}))}>
                              {legalChecks.agreement ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">He leído y acepto el <span className="text-emerald-400 underline">Acuerdo Marco</span>.</p>
                          </label>

                          <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, nature: !prev.nature}))}>
                              {legalChecks.nature ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">Entiendo que NO adquiero acciones ni propiedad directa.</p>
                          </label>

                          <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, risk: !prev.risk}))}>
                              {legalChecks.risk ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">Acepto los riesgos tecnológicos asociados a Web3.</p>
                          </label>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                           <button 
                            disabled={!legalChecks.agreement || !legalChecks.nature || !legalChecks.risk}
                            className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 ${
                              (legalChecks.agreement && legalChecks.nature && legalChecks.risk) 
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]' 
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                           >
                              Procesar Pago (Mock) <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
