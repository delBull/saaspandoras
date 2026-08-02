'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Megaphone, 
  Target, 
  BarChart3, 
  Globe, 
  Users, 
  Zap, 
  Send,
  Building2,
  Tv,
  ArrowUpRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrowthOSLeadModal } from "@/components/marketing/GrowthOSLeadModal";

export default function PandorasMediaCoLandingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('media_co_landing');

  const handleOpenCTA = (source: string) => {
    setModalSource(source);
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-indigo-500 selection:text-white font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[180px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-light tracking-tight text-white">PANDORA'S</span>
              <span className="text-xs text-indigo-400 font-mono ml-2">MEDIA CO</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-light">
            <a href="#prospeccion" className="hover:text-white transition-colors">Prospección Distribuida</a>
            <a href="#canales" className="hover:text-white transition-colors">Omnicanalidad</a>
            <a href="#tri-hub" className="hover:text-white transition-colors">Comunicación Tridireccional</a>
          </div>

          <Button 
            onClick={() => handleOpenCTA('media_co_nav_cta')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Lanzar Campaña Media Co
          </Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center">
        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pandora's Growth OS — Demand Generation Engine</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white max-w-5xl mx-auto leading-tight mb-8">
          Motor de generación de demanda y prospección directa para <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-purple-400 bg-clip-text text-transparent font-normal">empresas y desarrollos patrimoniales</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 font-light max-w-3xl mx-auto mb-10 leading-relaxed">
          Pandora's Media Co impulsa la prospección masiva distribuida, conectando contenidos de alta atracción con Hermes AI Agent OS para calificar y convertir clientes potenciales de forma autónoma.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            onClick={() => handleOpenCTA('media_co_hero_cta')}
            size="lg"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Activar Demanda Distribuida</span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Link
            href="/growth-os/hermes"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Conectar con Hermes Agent OS</span>
          </Link>
        </div>
      </section>

      {/* TRIDIRECTIONAL HUB SECTION */}
      <section id="tri-hub" className="py-20 px-6 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs px-3 py-1 font-mono mb-4">Tri-Hub Communication Protocol</Badge>
          <h2 className="text-3xl font-light text-white mb-6">Comunicación Tridireccional Autónoma</h2>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto mb-16 font-light">
            Media Co no trabaja de forma aislada; establece una sincronía fluida entre la producción de medios, el proyecto empresarial y el motor de agentes Hermes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="border border-zinc-800 rounded-2xl bg-zinc-950 p-6">
              <Megaphone className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">1. Pandora's Media Co</h3>
              <p className="text-xs text-zinc-400 font-light">Produce la narrativa, distribuye contenidos de atracción y capta la atención del mercado objetivo.</p>
            </div>

            <div className="border border-indigo-500/30 rounded-2xl bg-indigo-500/5 p-6 relative">
              <Zap className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">2. Hermes Agent Engine</h3>
              <p className="text-xs text-zinc-400 font-light">Recibe el lead de forma instantánea, califica el perfil, resuelve objeciones y entrega dossiers.</p>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-950 p-6">
              <Building2 className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">3. Empresa / Proyecto (S'Narai)</h3>
              <p className="text-xs text-zinc-400 font-light">Recibe compradores calificados listos para reserva SPEI Fast Lane o firma de contratos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-[#070709] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-8">
            Impulsa tus ventas con la infraestructura de demanda de Pandora's.
          </h2>
          <Button
            onClick={() => handleOpenCTA('media_co_final_cta')}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-base px-10 py-5 rounded-2xl shadow-xl shadow-indigo-600/25 transition-all"
          >
            Iniciar Estrategia de Prospección
          </Button>
        </div>
      </section>

      <GrowthOSLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        tierName="Pandora's Media Co Infrastructure"
        source={modalSource}
      />
    </div>
  );
}
