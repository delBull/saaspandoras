'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Radio, 
  Store, 
  Coins, 
  Vault, 
  ArrowUpRight,
  Building2,
  Lock,
  Workflow,
  Zap,
  Globe,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrowthOSLeadModal } from "@/components/marketing/GrowthOSLeadModal";

export default function PandorasPlatformLandingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('pandoras_platform_landing');

  const handleOpenCTA = (source: string) => {
    setModalSource(source);
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-500 selection:text-black font-sans relative overflow-hidden">
      {/* Ambient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-amber-500/10 via-indigo-500/5 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[180px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-light tracking-tight text-white">PANDORAS</span>
              <span className="text-xs text-amber-400 font-mono ml-2">Platform OS</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-light">
            <a href="#ecosystem" className="hover:text-white transition-colors">Ecosistema</a>
            <Link href="/growth-os/hermes" className="hover:text-amber-400 transition-colors">Hermes Runtime</Link>
            <Link href="/media" className="hover:text-white transition-colors">Media Co</Link>
            <a href="#marketplace" className="hover:text-white transition-colors">Agent Marketplace</a>
          </div>

          <Button 
            onClick={() => handleOpenCTA('platform_nav_cta')}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10"
          >
            Explorar la Plataforma
          </Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Autonomous Enterprise Platform</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white max-w-5xl mx-auto leading-tight mb-8">
          Instala un ecosistema completo de <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-normal">agentes autónomos</span> bajo tu propia marca.
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 font-light max-w-3xl mx-auto mb-10 leading-relaxed">
          Pandora's permite que cualquier empresa despliegue su propio ecosistema de agentes autónomos, marketing, automatización y operaciones bajo su marca, utilizando una infraestructura compartida, modular y multi-tenant.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Button
            onClick={() => handleOpenCTA('platform_hero_cta')}
            size="lg"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Solicitar una Demo</span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Link
            href="/growth-os/hermes"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all flex items-center justify-center gap-2"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Ver Hermes Agent Infrastructure</span>
          </Link>

          <Link
            href="/media"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4 text-purple-400" />
            <span>Media Co</span>
          </Link>
        </div>

        {/* PARADIGM SHIFT BANNER */}
        <div className="border border-zinc-800/80 rounded-3xl bg-zinc-950/80 p-8 backdrop-blur-2xl max-w-4xl mx-auto text-center mb-24">
          <h3 className="text-xl md:text-2xl font-light text-white mb-4">
            No vendemos un chatbot. No vendemos un CRM. No vendemos automatizaciones.
          </h3>
          <p className="text-sm text-amber-400 font-mono">
            Construimos la infraestructura para empresas autónomas.
          </p>
        </div>

        {/* PANDORAS PLATFORM ECOSYSTEM MAP */}
        <div id="ecosystem" className="text-left max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-mono mb-4">Arquitectura de Capas</Badge>
            <h2 className="text-3xl font-light text-white">Pandora's Platform Topology</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Layer 1: Growth OS */}
            <div className="border border-zinc-800 rounded-2xl bg-zinc-950 p-6">
              <div className="flex justify-between items-center mb-4">
                <Layers className="w-6 h-6 text-amber-400" />
                <Badge className="bg-zinc-800 text-zinc-300 text-[9px] font-mono">Core OS</Badge>
              </div>
              <h3 className="text-base font-medium text-white mb-2">Growth OS</h3>
              <p className="text-xs text-zinc-400 font-light mb-4">Sistema operativo empresarial de automatización de crecimiento, analítica y CRM relacional.</p>
              <Link href="/growth-os" className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1">Explorar Growth OS <ArrowUpRight className="w-3 h-3" /></Link>
            </div>

            {/* Layer 2: Hermes Platform */}
            <div className="border border-amber-500/30 rounded-2xl bg-amber-500/5 p-6 relative">
              <div className="flex justify-between items-center mb-4">
                <Cpu className="w-6 h-6 text-amber-400" />
                <Badge className="bg-amber-500/20 text-amber-400 text-[9px] font-mono">AI-OS Infrastructure</Badge>
              </div>
              <h3 className="text-base font-medium text-white mb-2">Hermes Agent Platform</h3>
              <p className="text-xs text-zinc-400 font-light mb-4">Runtime multi-tenant con Command Center en 7 Studios, Execution OS (Outbox), Intent Engine, Capability Registry y Governance Queue.</p>
              <Link href="/growth-os/hermes" className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1">Ver Hermes Runtime v7 <ArrowUpRight className="w-3 h-3" /></Link>
            </div>

            {/* Layer 3: Media Infrastructure */}
            <div id="media" className="border border-zinc-800 rounded-2xl bg-zinc-950 p-6">
              <div className="flex justify-between items-center mb-4">
                <Radio className="w-6 h-6 text-indigo-400" />
                <Badge className="bg-zinc-800 text-zinc-300 text-[9px] font-mono">Media Engine</Badge>
              </div>
              <h3 className="text-base font-medium text-white mb-2">Pandora's Media Co</h3>
              <p className="text-xs text-zinc-400 font-light mb-4">Generación de demanda, prospección distribuida y comunicación de marca automatizada.</p>
              <Link href="/media" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1">Ver Media Infrastructure <ArrowUpRight className="w-3 h-3" /></Link>
            </div>

            {/* Layer 4: Agent Marketplace */}
            <div id="marketplace" className="border border-zinc-800 rounded-2xl bg-zinc-950 p-6">
              <div className="flex justify-between items-center mb-4">
                <Store className="w-6 h-6 text-emerald-400" />
                <Badge className="bg-zinc-800 text-zinc-300 text-[9px] font-mono">Marketplace</Badge>
              </div>
              <h3 className="text-base font-medium text-white mb-2">Agent Marketplace</h3>
              <p className="text-xs text-zinc-400 font-light mb-4">Catálogo de Domain Packs, workflows y herramientas listas para instalar en 1-clic.</p>
              <button onClick={() => handleOpenCTA('marketplace_info')} className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1">Explorar Marketplace <ArrowUpRight className="w-3 h-3" /></button>
            </div>

            {/* Layer 5: Commerce Infrastructure */}
            <div className="border border-zinc-800 rounded-2xl bg-zinc-950 p-6">
              <div className="flex justify-between items-center mb-4">
                <Coins className="w-6 h-6 text-purple-400" />
                <Badge className="bg-zinc-800 text-zinc-300 text-[9px] font-mono">Transactions</Badge>
              </div>
              <h3 className="text-base font-medium text-white mb-2">Commerce Infrastructure</h3>
              <p className="text-xs text-zinc-400 font-light mb-4">Transaction Engine con Checkout Web3 USDC, reservas SPEI Fast Lane y emisión de contratos.</p>
              <span className="text-xs text-zinc-500 font-mono">Integrado en Hermes Commerce</span>
            </div>

            {/* Layer 6: Treasury Infrastructure */}
            <div className="border border-zinc-800 rounded-2xl bg-zinc-950 p-6">
              <div className="flex justify-between items-center mb-4">
                <Vault className="w-6 h-6 text-yellow-400" />
                <Badge className="bg-zinc-800 text-zinc-300 text-[9px] font-mono">Treasury</Badge>
              </div>
              <h3 className="text-base font-medium text-white mb-2">Treasury Infrastructure</h3>
              <p className="text-xs text-zinc-400 font-light mb-4">Gestión patrimonial, distribuciones pro-rata transparentes y liquidación fiduciaria.</p>
              <Link href="/governance" className="text-xs text-yellow-400 hover:text-yellow-300 font-mono flex items-center gap-1">Ver Gobernanza <ArrowUpRight className="w-3 h-3" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE FLOW DIAGRAM */}
      <section className="py-24 px-6 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-mono mb-4">Flujo Integrado</Badge>
          <h2 className="text-3xl font-light text-white mb-12">Cómo opera el ecosistema Pandora's</h2>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
            <span className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">Contenido (Media Co)</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <span className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">Marketing & Prospectos</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <span className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">Growth OS CRM</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <span className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">Hermes Runtime v7</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <span className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">Execution OS (Outbox)</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <span className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Checkout Web3 / SPEI</span>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-[#070709] text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono">
            Pandoras Growth OS — The Autonomous Enterprise Platform
          </Badge>
          <h2 className="text-3xl md:text-5xl font-light text-white mb-8">
            Construye la infraestructura inteligente que tu empresa necesita.
          </h2>
          <Button
            onClick={() => handleOpenCTA('platform_final_cta')}
            size="lg"
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium text-base px-10 py-5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all"
          >
            Solicitar Acceso a Pandoras Platform
          </Button>
        </div>
      </section>

      <GrowthOSLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        tierName="Pandora's Platform OS"
        source={modalSource}
      />
    </div>
  );
}
