'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Bot, 
  ShieldCheck, 
  Zap, 
  Users, 
  FolderGit2, 
  MessageSquare, 
  Lock, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  ArrowUpRight,
  Database,
  Layers,
  Cpu,
  BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrowthOSLeadModal } from "@/components/marketing/GrowthOSLeadModal";

export default function HermesB2BLandingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('hermes_b2b_landing');

  const handleOpenCTA = (source: string) => {
    setModalSource(source);
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-500 selection:text-black font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[160px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-light tracking-tight text-white">HERMES</span>
              <span className="text-xs text-amber-400 font-mono ml-2">Growth OS Engine</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-light">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#security" className="hover:text-white transition-colors">Seguridad de Datos</a>
            <a href="#vault" className="hover:text-white transition-colors">Agency Vault</a>
            <a href="#objections" className="hover:text-white transition-colors">Mapeo de Objeciones</a>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => handleOpenCTA('hermes_b2b_header')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-medium px-5 py-2.5 rounded-full shadow-lg shadow-amber-500/20 transition-all"
            >
              Activar Hermes B2B
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gestor Patrimonial IA Autónomo para Agencias & Desarrolladores</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white max-w-4xl mx-auto leading-tight mb-8">
          El Agente de Ventas IA que <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-normal">Prospecta, Atiende Dudas Legales y Cierra</span> 24/7 en Telegram.
        </h1>

        <p className="text-base md:text-lg text-zinc-400 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
          Hermes absorbe tu base de datos de clientes, envía documentación oficial del Data Room, maneja objeciones complejas de inversión y emite enlaces de compra Web3 y SPEI Fast Lane en tiempo real.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => handleOpenCTA('hermes_b2b_hero')}
            size="lg"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Solicitar Demo Hermes B2B</span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <a
            href="https://t.me/snarai_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Probar Bot en Telegram Live</span>
          </a>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs text-amber-400 font-mono uppercase tracking-widest">Capacidades de Hermes Engine</p>
          <h2 className="text-3xl font-light text-white">Prospección, Calificación y Cierre en un solo flujo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-normal text-white">Ingesta de Bases de Datos (Agency Vault)</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Carga tu base de clientes (CSV/Excel) mediante el Portal de Gestores. Hermes ejecuta secuencias proactivas de prospección con encriptación AES-256 por agencia.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-normal text-white">Envío Directo de Evidencia & Data Room</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Hermes comparte Master Plans, Fichas Técnicas de Fases, Dossiers Legales en PDF y acceso controlado a las 6 carpetas corporativas del `/nexus`.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-normal text-white">Checkout Inmediato (Web3 & SPEI)</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Resuelve objeciones legales e imprevistos y genera ligas de pago personalizadas en USDC/USDT o mediante transferencia SPEI en Pesos (Fast Lane).
            </p>
          </div>
        </div>
      </section>

      {/* AGENCY VAULT & PRIVACY BOUNDARY */}
      <section id="vault" className="py-20 px-6 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="p-10 md:p-14 rounded-[3rem] border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.05] via-zinc-950 to-zinc-950 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs px-3 py-1 font-mono">
              Blindaje de Datos Institucional
            </Badge>
            <h2 className="text-3xl font-light text-white leading-tight">
              Tus bases de clientes quedan protegidas en tu Agency Vault.
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 font-light leading-relaxed">
              Cada agencia cuenta con un contenedor aislado con **Row Level Security (RLS)** y encriptación de datos. Hermes procesa y califica a los prospectos sin exponer tu base de datos a competidores ni terceros.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Firma de Convenio de Ingesta & Deslinde Patrimonial al subir CSV.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Absorción segura en el grafo de comportamiento de Pandoras.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Integración whitelabel: Pandoras opera de fondo sin desplazar a la agencia.</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 space-y-4 font-mono text-xs text-zinc-300">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-amber-400">agency_vault_security.ts</span>
              <Lock className="w-4 h-4 text-zinc-500" />
            </div>
            <pre className="text-[11px] leading-relaxed text-zinc-400 overflow-x-auto">
{`// Protocolo de Separación de Capas (RLS)
export const agencyVaultConfig = {
  encryption: "AES-256-GCM",
  isolationLevel: "TENANT_STRICT",
  legalAgreement: "TERMS_OF_DATA_INGESTION_V2",
  absorptionMode: "ENRICHED_BEHAVIOR_GRAPH",
  whiteLabelMode: true
};`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-light text-white mb-6">
          ¿Listo para activar Hermes en tu inmobiliaria o desarrollo?
        </h2>
        <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl mx-auto mb-10">
          Despliega el Gestor Patrimonial IA en tu canal oficial de Telegram y comienza a calificar y cerrar clientes en automático.
        </p>
        <Button
          onClick={() => handleOpenCTA('hermes_b2b_footer')}
          size="lg"
          className="bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm px-10 py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all"
        >
          Activar Hermes B2B Ahora
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 px-6 text-center text-xs text-zinc-500 font-light">
        <p>Pandoras Growth OS © 2026. Titular Registral: MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.</p>
      </footer>

      {/* Lead Capture Modal */}
      <GrowthOSLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        source={modalSource}
      />
    </div>
  );
}
