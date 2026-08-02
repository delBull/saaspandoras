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
  BarChart3,
  Globe,
  Building2,
  PhoneCall,
  Sliders,
  Workflow,
  KeyRound,
  LayoutDashboard
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrowthOSLeadModal } from "@/components/marketing/GrowthOSLeadModal";

export default function HermesEnterpriseLandingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('hermes_enterprise_landing');

  const handleOpenCTA = (source: string) => {
    setModalSource(source);
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-500 selection:text-black font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-amber-500/10 via-indigo-500/5 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[180px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-light tracking-tight text-white">HERMES</span>
              <span className="text-xs text-amber-400 font-mono ml-2">AI Agent Infrastructure</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-light">
            <a href="#ecosystem" className="hover:text-white transition-colors">Ecosistema</a>
            <a href="#runtime" className="hover:text-white transition-colors">Hermes Runtime</a>
            <a href="#packs" className="hover:text-white transition-colors">Domain Packs</a>
            <a href="#whitelabel" className="hover:text-white transition-colors">White-Label Platform</a>
          </div>

          <Button 
            onClick={() => handleOpenCTA('hermes_nav_cta')}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10"
          >
            Solicitar Acceso Enterprise
          </Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pandoras Growth OS — Autonomous Agent Infrastructure</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white max-w-5xl mx-auto leading-tight mb-8">
          AI Agent Infrastructure para empresas que quieren <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-normal">operar con inteligencia autónoma</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 font-light max-w-3xl mx-auto mb-6 leading-relaxed">
          Instala tu propio ecosistema de agentes autónomos bajo tu marca.
        </p>

        <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
          Pandoras permite que cualquier empresa despegue agentes inteligentes especializados para ventas, atención, operaciones y crecimiento, utilizando una infraestructura compartida, segura y escalable.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-mono mb-12">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Sin construir tecnología desde cero</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Sin contratar equipos de IA</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Sin desarrollar sistemas complejos</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            onClick={() => handleOpenCTA('hermes_hero_cta')}
            size="lg"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Activar Tu Ecosistema de Agentes</span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Link
            href="/agency/vault"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Portal de Gestores (White-Label)</span>
          </Link>
        </div>

        {/* ENTERPRISE DASHBOARD & MULTI-AGENT VISUALIZATION */}
        <div className="relative border border-zinc-800/80 rounded-3xl bg-zinc-950/80 p-8 backdrop-blur-2xl shadow-2xl overflow-hidden max-w-5xl mx-auto text-left">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-zinc-400 ml-2">Pandoras Agent Platform OS — Tenant: Luxury Homes Riviera (tenant_002)</span>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">Multi-Tenant Active</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connected Agent 1 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Hermes Real Estate Advisor</h4>
                  <p className="text-[11px] text-amber-400 font-mono">Pack: real-estate-premium</p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Prospecta, califica y envía dossiers legales.</p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono border-t border-zinc-800/60 pt-2">
                <Globe className="w-3 h-3" /> Web | Telegram | WhatsApp
              </div>
            </div>

            {/* Connected Agent 2 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Hermes B2B Sales Agent</h4>
                  <p className="text-[11px] text-indigo-400 font-mono">Pack: enterprise-b2b</p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Califica leads y agenda reuniones corporativas.</p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono border-t border-zinc-800/60 pt-2">
                <PhoneCall className="w-3 h-3" /> Voice AI | Email | Web
              </div>
            </div>

            {/* Connected Agent 3 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Customer Success Agent</h4>
                  <p className="text-[11px] text-emerald-400 font-mono">Pack: support-operations</p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Soporte post-venta y resolución de dudas.</p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono border-t border-zinc-800/60 pt-2">
                <MessageSquare className="w-3 h-3" /> Web Widget | Telegram
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARADIGM SHIFT SECTION */}
      <section className="py-20 px-6 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-light text-white mb-6">
            El futuro de las empresas no tendrá empleados digitales aislados. <br />
            <span className="text-amber-400 font-normal">Tendrá ecosistemas de agentes coordinados.</span>
          </h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-3xl mx-auto mb-16 font-light">
            Las empresas están acumulando herramientas, canales y datos fragmentados. Hermes conecta todo en una sola capa inteligente:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            {[
              { icon: MessageSquare, label: "Conversaciones", desc: "Omnicanalidad nativa" },
              { icon: Users, label: "CRM", desc: "Memory Engine relacional" },
              { icon: BarChart3, label: "Marketing & Ventas", desc: "Prospección autónoma" },
              { icon: FileText, label: "Documentos", desc: "Resource Engine & Nexus" },
              { icon: Zap, label: "Pagos & Reservas", desc: "Transaction Engine Web3/SPEI" },
              { icon: Workflow, label: "Operaciones", desc: "Workflows y misiones" },
            ].map((item, idx) => (
              <div key={idx} className="border border-zinc-800/60 rounded-2xl bg-zinc-900/30 p-5 flex items-start gap-4">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{item.label}</h4>
                  <p className="text-xs text-zinc-400 font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT IS HERMES */}
      <section id="ecosystem" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-mono mb-4">Plataforma Operativa</Badge>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">¿Qué es Hermes?</h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light">
            Hermes es la infraestructura de agentes autónomos de Pandoras Growth OS. Un runtime empresarial diseñado para crear, instalar y operar agentes inteligentes personalizados para cualquier industria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono mb-4">01. Su propia marca</Badge>
            <h3 className="text-base font-medium text-white mb-2">Brand Engine</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              El agente opera bajo la identidad visual, logo, tono y firma de comunicación de cada organización.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono mb-4">02. Sus propios procesos</Badge>
            <h3 className="text-base font-medium text-white mb-2">Workflows & Policies</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Cada agente sigue workflows, reglas de cumplimiento y estrategias comerciales específicas.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono mb-4">03. Sus propios conocimientos</Badge>
            <h3 className="text-base font-medium text-white mb-2">Domain Packs</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Cada empresa instala sus propios paquetes de dominio, documentos, productos y FAQs.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono mb-4">04. Sus propios canales</Badge>
            <h3 className="text-base font-medium text-white mb-2">Omnicanalidad</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Telegram, WhatsApp, Web Widget, Email, SMS, Voice AI y futuros adaptadores.
            </p>
          </div>
        </div>
      </section>

      {/* DOMAIN PACKS SECTION */}
      <section id="packs" className="py-24 px-6 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Domain Packs</h2>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light">
              Cada industria puede tener su propio ecosistema especializado. Instala capacidades listas para usar:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Building2 className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">Real Estate Pack</h3>
              <p className="text-xs text-zinc-400 font-light">
                Agentes para desarrollos inmobiliarios, ventas patrimoniales, tokenización y reservas SPEI.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Zap className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">Financial Pack</h3>
              <p className="text-xs text-zinc-400 font-light">
                Agentes para productos financieros, educación de inversiones y transacciones seguras.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Cpu className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">Enterprise Pack</h3>
              <p className="text-xs text-zinc-400 font-light">
                Agentes internos para compañías con procesos de operaciones, CRM y seguimiento personalizado.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Sliders className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">Custom Pack</h3>
              <p className="text-xs text-zinc-400 font-light">
                Crea un agente completamente adaptado a las reglas, documentos y herramientas de tu negocio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHITE-LABEL PLATFORM & TENANT ISOLATION */}
      <section id="whitelabel" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-mono mb-6">White Label Agent Platform</Badge>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Tu empresa no utiliza un software genérico. <br />
              <span className="text-amber-400 font-normal">Construye su propia infraestructura inteligente bajo su marca.</span>
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 h-fit">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Brand Layer</h4>
                  <p className="text-xs text-zinc-400 font-light">Nombre propio, logo, identidad visual, tono de comunicación y personalidad del agente.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 h-fit">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Tenant Isolation</h4>
                  <p className="text-xs text-zinc-400 font-light">Datos separados por organización (RLS), permisos independientes y seguridad multi-tenant.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 h-fit">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Agent Management</h4>
                  <p className="text-xs text-zinc-400 font-light">Crea múltiples agentes, asigna funciones, instala capacidades y administra todos tus canales de comunicación.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800 rounded-3xl bg-zinc-950 p-8 relative">
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
              <span className="text-xs font-mono text-zinc-400">Agent Installer Workflow</span>
              <Badge className="bg-amber-500/10 text-amber-400 text-[10px] font-mono">AgentBlueprint</Badge>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                <span>1. Seleccionar Blueprint</span>
                <span className="text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                <span>2. Inyectar Brand Configuration</span>
                <span className="text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                <span>3. Cargar Domain Pack</span>
                <span className="text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                <span>4. Asignar Tenant Policies</span>
                <span className="text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-400">
                <span>5. Activar Omnichannel Runtime</span>
                <span className="animate-pulse">● Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 px-6 border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-[#070709] text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono">
            Pandoras Growth OS Platform
          </Badge>

          <h2 className="text-3xl md:text-5xl font-light text-white mb-8">
            Para empresas que quieren operar diferente.
          </h2>

          <p className="text-base md:text-lg text-zinc-400 font-light mb-12 max-w-2xl mx-auto">
            La próxima generación de compañías no solamente tendrá software. Tendrá inteligencia operativa autónoma. Hermes permite instalar esa inteligencia. Bajo tu marca. Con tus procesos. Con tu ecosistema.
          </p>

          <Button
            onClick={() => handleOpenCTA('hermes_final_cta')}
            size="lg"
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium text-base px-10 py-5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all"
          >
            Solicitar Acceso a Hermes Growth OS
          </Button>
        </div>
      </section>

      {/* Lead Capture Modal */}
      <GrowthOSLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        tierName="Hermes Enterprise AI Infrastructure"
        source={modalSource}
      />
    </div>
  );
}
