"use client";

import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Sparkles, 
  X, 
  Sliders, 
  ExternalLink 
} from 'lucide-react';
import { 
  SimulatorIndustry, 
  SimulatorGoal, 
  SIMULATOR_INDUSTRIES 
} from '@/lib/hermes/simulator-types';

interface SalesDemoBuilderDrawerProps {
  currentCompany: string;
  currentIndustry: SimulatorIndustry;
  currentGoal: SimulatorGoal;
  attributionRep?: string;
  isOpen: boolean;
  onClose: () => void;
  guidedDemoMode?: boolean;
  onGuidedModeChange?: (mode: boolean) => void;
}

export function SalesDemoBuilderDrawer({
  currentCompany,
  currentIndustry,
  currentGoal,
  attributionRep,
  isOpen,
  onClose,
  guidedDemoMode = false,
  onGuidedModeChange,
}: SalesDemoBuilderDrawerProps) {
  const [company, setCompany] = useState(currentCompany);
  const [industry, setIndustry] = useState<SimulatorIndustry>(currentIndustry);
  const [goal, setGoal] = useState<SimulatorGoal>(currentGoal);
  const [rep, setRep] = useState(attributionRep || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pandoras.finance';
  const queryParams = new URLSearchParams();
  if (company.trim()) queryParams.set('company', company.trim());
  if (industry) queryParams.set('industry', industry);
  if (goal) queryParams.set('goal', goal);
  if (rep.trim()) queryParams.set('rep', rep.trim());
  queryParams.set('source', 'sales_rep');

  const generatedUrl = `${baseUrl}/hermes/simulator?${queryParams.toString()}`;

  const whatsappMessage = encodeURIComponent(
    `Hola ${company.trim() || ''}! 👋\n\nConfiguré una simulación de Hermes para que veas exactamente cómo atendería, calificaría y cerraría prospectos 24/7 en tus canales de venta:\n\n${generatedUrl}\n\nPruébalo en 2 minutos y me dices qué te parece.`
  );

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0F0F16] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Herramienta Interna: Generador de Demo para Clientes</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
              Empresa del Prospecto
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Ej: Grupo Altius, Porsche Polanco..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Industria / Vertical
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as SimulatorIndustry)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#14141F] border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
              >
                {Object.values(SIMULATOR_INDUSTRIES).map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Objetivo Comercial
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as SimulatorGoal)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#14141F] border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="QUALIFY_LEADS">Calificar Prospectos</option>
                <option value="BOOK_APPOINTMENTS">Agendar Citas / Visitas</option>
                <option value="CLOSE_SALES">Cerrar Ventas & Cotizar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
              Tu Identificador de Asesor (Atribución)
            </label>
            <input
              type="text"
              value={rep}
              onChange={(e) => setRep(e.target.value)}
              placeholder="Ej: marco, asesor_norte..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Guided Demo Mode — internal toggle for live calls with prospect */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono text-zinc-300 font-bold block">
                Demo Guiada en Vivo
              </span>
              <span className="text-[10px] text-zinc-500 block">
                Suprime el modal de lead para que el chat quede limpio durante una llamada.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={guidedDemoMode}
              onClick={() => onGuidedModeChange?.(!guidedDemoMode)}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${
                guidedDemoMode ? 'bg-purple-600' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  guidedDemoMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Generated Link Preview */}
          <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              Enlace Personalizado Generado:
            </span>
            <p className="text-[11px] font-mono text-purple-300 break-all select-all">
              {generatedUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Enlace Copiado' : 'Copiar Enlace'}</span>
          </button>

          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Compartir WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
