'use client';

import React, { useState } from 'react';
import { snaraiMaterials } from '@/lib/marketing/snarai-materials';
import { 
  FolderIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  CalculatorIcon, 
  PhotoIcon,
  PlayIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  LinkIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const SCRIPT_CATEGORIES = [
  {
    title: "Primer Contacto",
    script: "¡Hola! ¿Cómo estás? Te escribo porque recordé que estabas buscando diversificar en bienes raíces. Acabo de conocer un proyecto de inversión en preventa en Bucerías (S'Narai) que me pareció espectacular por el modelo de Fideicomiso y los yields operativos (10-12%). ¿Tienes 5 minutos esta semana para contarte rápido de qué trata?"
  },
  {
    title: "Seguimiento tras enviar info",
    script: "¡Hola! ¿Tuviste oportunidad de darle una revisada rápida al Investment Deck de S'Narai que te mandé? Cuéntame qué te pareció el esquema de entrada temprana en Fase Fundador. Si tienes dudas con el modelo de participación estructurada, podemos hacer una videollamada de 10 min."
  },
  {
    title: "Objeción: 'Está muy caro'",
    script: "Entiendo perfectamente el punto. Sin embargo, en S'Narai no estás comprando m2 tradicionales, estás adquiriendo una fracción de las utilidades de un edificio premium operado de forma hotelera, entrando con el mayor descuento (Fase Fundador a $50). El retorno real no viene de vender el m2, sino del flujo de caja (yield) a largo plazo."
  },
  {
    title: "Objeción: 'No conozco la zona'",
    script: "¡Es justo la ventaja! La Zona Dorada de Bucerías tiene un déficit brutal de producto premium para nómadas digitales y turismo internacional de media/larga estancia. S'Narai está posicionado exactamente para absorber esa demanda que Sayulita o Puerto Vallarta ya no pueden soportar por saturación."
  }
];

export function PartnerHub({ projectSlug }: { projectSlug: string }) {
  const [activeTab, setActiveTab] = useState<'docs' | 'playbook' | 'calculator' | 'scripts'>('docs');
  
  // Calculator State
  const [investmentInput, setInvestmentInput] = useState<string>("50000");
  const commissionRate = 0.03; // 3%
  const calculatedCommission = parseFloat(investmentInput || "0") * commissionRate;

  return (
    <div className="w-full bg-zinc-950 text-white rounded-3xl overflow-hidden border border-amber-500/20">
      {/* Header */}
      <div className="p-8 bg-zinc-900/80 border-b border-amber-500/20">
        
        {/* Banner Nuevo Aquí */}
        <div className="mb-8">
          <button 
            onClick={() => setActiveTab('playbook')}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
          >
            <RocketLaunchIcon className="w-6 h-6" />
            ¿Nuevo aquí? Empieza aquí
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-white">S'Narai <span className="text-amber-500">Partner Hub</span></h2>
            <p className="text-zinc-400 mt-2">Centro Comercial para Gestores Patrimoniales. Todo lo que necesitas para vender hoy.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText("https://snarai.com");
                alert("Enlace del proyecto copiado. ¡Compártelo con tus clientes!");
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors border border-zinc-700"
            >
              <LinkIcon className="w-5 h-5" />
              Copiar enlace web
            </button>
            <a 
              href="https://drive.google.com/drive/folders/1lDIzONsj29dIhxsbLID-ShjL_E-U3hGa?usp=sharing"
              target="_blank"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold rounded-xl transition-colors border border-amber-500/30"
            >
              <PhotoIcon className="w-5 h-5" />
              Galería (Drive)
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mt-8 pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('docs')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'docs' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <FolderIcon className="w-5 h-5" />
            Documentos
          </button>
          <button 
            onClick={() => setActiveTab('playbook')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'playbook' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <PlayIcon className="w-5 h-5" />
            15-Min Playbook
          </button>
          <button 
            onClick={() => setActiveTab('calculator')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'calculator' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <CalculatorIcon className="w-5 h-5" />
            Calculadora (3%)
          </button>
          <button 
            onClick={() => setActiveTab('scripts')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'scripts' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Scripts & Objeciones
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8">
        
        {/* Tab 1: Documentos Core */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {snaraiMaterials.map((mat) => (
              <div key={mat.id} className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                    <DocumentTextIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    PDF
                  </span>
                </div>
                <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors mb-2">{mat.title}</h3>
                <p className="text-sm text-zinc-400 mb-6 flex-1">
                  {mat.description}
                </p>
                <a 
                  href={`/materials/${projectSlug}/${mat.id}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-sm w-full text-center font-bold text-black bg-amber-500 hover:bg-amber-400 py-3 rounded-xl transition-colors mt-auto"
                >
                  Abrir Documento
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Playbook */}
        {activeTab === 'playbook' && (
          <div className="space-y-8">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3">
                <PlayIcon className="w-8 h-8" />
                ¿Cómo vender S'Narai en 15 minutos?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {[
                    "Manda WhatsApp de Primer Contacto (Pestaña Scripts)",
                    "Muestra el Video de 90 segundos (Drive)",
                    "Abre el Investment Deck y enfócate en Fase Fundador",
                    "Abre la Calculadora de Retornos",
                    "Envía el Due Diligence para generar certeza técnica",
                    "Agenda videollamada para cierre de dudas",
                    "Comparte el proceso de aporte (Investment Process)"
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-8 h-8 shrink-0 bg-amber-500 text-black font-bold rounded-full flex items-center justify-center">
                        {i + 1}
                      </div>
                      <p className="text-zinc-300 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-black/50 p-6 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-amber-400" />
                    Checklist antes de enviar info
                  </h4>
                  <ul className="space-y-3">
                    {["¿Ya calificó al cliente?", "¿Ya conoce su presupuesto?", "¿Es inversionista o usuario final?", "¿Ya sabe cuándo quiere comprar?"].map((chk, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm">
                        <CheckCircleIcon className="w-5 h-5 text-amber-500/50" />
                        {chk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Calculator */}
        {activeTab === 'calculator' && (
          <div className="max-w-3xl mx-auto bg-zinc-900 border border-amber-500/30 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-white mb-4">Calculadora de Ganancias</h3>
              <p className="text-zinc-400">Comisión base del Gestor Patrimonial: <strong className="text-amber-400">3%</strong></p>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm uppercase tracking-widest text-zinc-500 font-bold mb-3">Monto de Inversión del Cliente (USD)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-500">$</span>
                  <input 
                    type="number" 
                    value={investmentInput}
                    onChange={(e) => setInvestmentInput(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-amber-500 rounded-2xl py-6 pl-12 pr-6 text-3xl font-black text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-12 bg-zinc-800 rounded-full" />
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 rounded-3xl p-8 text-center">
                <p className="text-sm uppercase tracking-widest text-amber-400 font-bold mb-2">Tu Comisión (3%)</p>
                <p className="text-6xl font-black text-white">${calculatedCommission.toLocaleString()} <span className="text-2xl text-amber-500/50">USD</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Scripts */}
        {activeTab === 'scripts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SCRIPT_CATEGORIES.map((cat, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative group">
                <h4 className="font-bold text-amber-400 mb-4">{cat.title}</h4>
                <p className="text-zinc-300 text-sm leading-relaxed mb-6">{cat.script}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(cat.script);
                    window.open(`https://wa.me/?text=${encodeURIComponent(cat.script)}`, '_blank');
                  }}
                  className="w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold rounded-xl transition-colors border border-[#25D366]/30 flex items-center justify-center gap-2"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  Copiar para WhatsApp
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
