'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  BrainCircuit,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
  FileText, 
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
import { HermesLegalModals } from "@/components/growth/HermesLegalModals";

// ─────────────────── HERMES CORE FEATURES & VALUE MATRIX ───────────────────

export default function HermesEnterpriseLandingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('hermes_enterprise_landing');
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  const handleOpenCTA = (source: string) => {
    setModalSource(source);
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-purple-500 selection:text-black font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-light tracking-tight text-white">HERMES</span>
              <span className="text-xs text-purple-400 font-mono ml-2 hidden sm:inline">AI Agent Infrastructure</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-light">
            <a href="#ecosystem" className="hover:text-white transition-colors">Ecosistema</a>
            <a href="#packs" className="hover:text-white transition-colors">Domain Packs</a>
            <a href="#whitelabel" className="hover:text-white transition-colors">White-Label Platform</a>
            <Link href="/media" className="hover:text-white transition-colors">Media Co</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/portal"
              className="text-xs text-zinc-400 hover:text-white font-light transition-colors"
            >
              Accede
            </Link>
            <Button 
              onClick={() => handleOpenCTA('hermes_nav_cta')}
              className="border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all"
            >
              <span className="hidden sm:inline">Solicitar Enterprise Assessment</span>
              <span className="sm:hidden">Assessment</span>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center">
        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pandoras Growth OS v7 — Enterprise AI Operating System</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white max-w-5xl mx-auto leading-tight mb-8">
          El Sistema Operativo de IA donde <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 bg-clip-text text-transparent font-normal">cada interacción persigue metas de negocio</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 font-light max-w-3xl mx-auto mb-6 leading-relaxed">
          Instala Journeys, Playbooks ejecutables y agentes autónomos bajo tu marca sin tocar el Kernel.
        </p>

        <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
          Pandoras permite a desarrollos patrimoniales, protocolos y empresas de servicios operar con <strong>Referral Trust Journeys sin FOMO</strong>, calificar prospectos en tiempo real y ejecutar cierres SPEI y Web3 24/7.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-mono mb-12">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Intent Engine & Goal Recognizer</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Human-in-the-Loop Governance Queue</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Capability Registry & Outbox Execution OS</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            onClick={() => handleOpenCTA('hermes_hero_cta')}
            size="lg"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all flex items-center justify-center gap-2"
          >
            <span>Solicitar Enterprise Assessment (30 min)</span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </Button>
        </div>

        {/* ENTERPRISE DASHBOARD & MULTI-AGENT VISUALIZATION */}
        <div className="relative border border-zinc-800/80 rounded-3xl bg-zinc-950/80 p-8 backdrop-blur-2xl shadow-2xl overflow-hidden max-w-5xl mx-auto text-left">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-purple-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-zinc-400 ml-2">Pandoras Enterprise AI OS v7 — Multi-Tenant Control Plane</span>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">Kernel v6 Congelado · Journeys v7 Active</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connected Agent 1 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Hermes Real Estate Concierge</h4>
                  <p className="text-[11px] text-purple-400 font-mono">Journey: patrimonial_investor_journey</p>
                </div>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Trust Journey de preservación patrimonial y agendamiento con fundadores.</p>
              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60 pt-2 flex justify-between">
                <span>Playbook: investor_v1</span>
                <span className="text-emerald-400">Objective: Meeting</span>
              </div>
            </div>

            {/* Connected Agent 2 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Hermes Sovereign (Educador Web3)</h4>
                  <p className="text-[11px] text-blue-400 font-mono">Journey: web3_sovereign_education</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Educación en soberanía digital, auto-custodia y agendamiento de workshops.</p>
              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60 pt-2 flex justify-between">
                <span>Playbook: sovereign_v1</span>
                <span className="text-emerald-400">Objective: Workshop</span>
              </div>
            </div>

            {/* Connected Agent 3 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Hermes Media Co (Atracción de Audiencia)</h4>
                  <p className="text-[11px] text-purple-400 font-mono">Journey: editorial_authority_journey</p>
                </div>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Captación editorial, distribución de contenidos y atribución de conversión.</p>
              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60 pt-2 flex justify-between">
                <span>Playbook: media_co_v1</span>
                <span className="text-emerald-400">Objective: Subscribe</span>
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
            <span className="text-purple-400 font-normal">Tendrá ecosistemas de agentes coordinados.</span>
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
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
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
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-3 py-1 font-mono mb-4">Pandora's Growth OS — Hermes Runtime v7</Badge>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">¿Qué es Hermes Runtime?</h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light">
            Hermes es el <strong>Runtime de Ejecución de Inteligencia Autónoma</strong> de Pandoras Growth OS. Un motor empresarial multi-tenant diseñado para crear, aprovisionar y operar agentes mediante un <strong>Command Center en 7 Studios</strong>, con un <strong>Execution OS basado en Outbox</strong>, <strong>Capability Registry</strong>, <strong>Intent Engine</strong> y <strong>Human-in-the-Loop Governance Queue</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-mono mb-4">01. Su propia marca</Badge>
            <h3 className="text-base font-medium text-white mb-2">Brand Engine</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              El agente opera bajo la identidad visual, logo, tono y firma de comunicación de cada organización.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-mono mb-4">02. Sus propios procesos</Badge>
            <h3 className="text-base font-medium text-white mb-2">Workflows & Policies</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Cada agente sigue workflows, reglas de cumplimiento y estrategias comerciales específicas.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-mono mb-4">03. Sus propios conocimientos</Badge>
            <h3 className="text-base font-medium text-white mb-2">Domain Packs</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Cada empresa instala sus propios paquetes de dominio, documentos, productos y FAQs.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-mono mb-4">04. Sus propios canales</Badge>
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
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-3 py-1 font-mono mb-4">Capability Registry — Domain Packs</Badge>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Domain Packs & Capabilities</h2>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light">
              Cada industria instala su propio ecosistema de capacidades desde el Capability Registry. Activa canales, playbooks y lógica de cierre en un clic:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Building2 className="w-8 h-8 text-purple-400 mb-4" />
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
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-3 py-1 font-mono mb-6">White Label Agent Platform</Badge>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Tu empresa no utiliza un software genérico. <br />
              <span className="text-purple-400 font-normal">Construye su propia infraestructura inteligente bajo su marca.</span>
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 h-fit">
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
              <Badge className="bg-purple-500/10 text-purple-400 text-[10px] font-mono">AgentBlueprint</Badge>
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
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-purple-400">
                <span>5. Activar Omnichannel Runtime</span>
                <span className="animate-pulse">● Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-800/80">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-mono mb-4">Pricing Estratégico</Badge>
          <h2 className="text-3xl md:text-5xl font-light text-white mb-6">
            Menos software. Más resultados.
          </h2>
          <p className="text-base md:text-lg text-zinc-400 font-light max-w-3xl mx-auto">
            Un Analista de Datos Jr. ($2,500/mes) + un Administrador CRM ($1,500/mes) + Software de Automatización ($500/mes) cuestan más de <span className="text-white font-medium">$4,500 USD al mes</span>. 
            Hermes reemplaza este ecosistema obsoleto por una fracción del costo, operando 24/7 sin errores ni descansos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Monthly Plan */}
          <div className="border border-zinc-800 rounded-3xl bg-zinc-900/40 p-8 md:p-12 flex flex-col relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Licencia Mensual</h3>
            <p className="text-sm text-zinc-400 mb-8 font-light">Flexibilidad total para probar la infraestructura operativa sin compromisos a largo plazo.</p>
            
            <div className="mb-8">
              <span className="text-4xl md:text-5xl font-black text-white">$499</span>
              <span className="text-zinc-500 font-mono text-sm"> / mes</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-sm text-zinc-300 font-light">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                Command Center Operativo
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-300 font-light">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                Automatización Omnicanal (WhatsApp, TG)
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-300 font-light">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                Reportes Analíticos Diarios
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-300 font-light">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                Soporte y Actualizaciones de Motor
              </li>
            </ul>

            <Button
              onClick={() => handleOpenCTA('hermes_pricing_monthly')}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-6 rounded-xl transition-colors"
            >
              Comenzar Mensual
            </Button>
          </div>

          {/* Annual Plan */}
          <div className="border border-purple-500/30 rounded-3xl bg-gradient-to-b from-purple-500/10 to-zinc-950 p-8 md:p-12 flex flex-col relative overflow-hidden transform md:-translate-y-4 shadow-2xl shadow-purple-500/10">
            <div className="absolute top-0 right-0 bg-purple-500 text-black text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
              2 Meses Gratis
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Licencia Anual (Pro)</h3>
            <p className="text-sm text-purple-200/70 mb-8 font-light">Para empresas comprometidas con escalar sus ventas operando sobre infraestructura autónoma.</p>
            
            <div className="mb-8">
              <span className="text-4xl md:text-5xl font-black text-white">$4,990</span>
              <span className="text-zinc-500 font-mono text-sm"> / año</span>
              <div className="text-xs font-mono text-emerald-400 mt-2">Ahorro de $998 USD vs Plan Mensual</div>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-sm text-zinc-300 font-light">
                <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                <span className="text-white font-medium">Todo lo del Plan Mensual, más:</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-300 font-light">
                <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                Setup Arquitectónico Prioritario
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-300 font-light">
                <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                Integración Avanzada a CRMs (HubSpot/Salesforce)
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-300 font-light">
                <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                Consultoría Trimestral de Growth
              </li>
            </ul>

            <Button
              onClick={() => handleOpenCTA('hermes_pricing_annual')}
              className="w-full bg-purple-500 hover:bg-purple-400 text-black font-bold py-6 rounded-xl shadow-lg shadow-purple-500/20 transition-all"
            >
              Comenzar Anual
            </Button>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 px-6 border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-[#070709] text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono">
            Pandoras Growth OS — Hermes Runtime v7
          </Badge>

          <h2 className="text-3xl md:text-5xl font-light text-white mb-8">
            Instala inteligencia operativa autónoma bajo tu marca.
          </h2>

          <p className="text-base md:text-lg text-zinc-400 font-light mb-12 max-w-2xl mx-auto">
            La próxima generación de compañías no tendrá herramientas desconectadas. Tendrá un sistema nervioso autónomo: agentes coordinados, Command Center operativo y Execution OS siempre activo. Hermes es esa infraestructura. Bajo tu marca. Con tus procesos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => handleOpenCTA('hermes_final_cta')}
              size="lg"
              className="bg-purple-500 hover:bg-purple-400 text-black font-medium text-base px-10 py-5 rounded-2xl shadow-xl shadow-purple-500/20 transition-all"
            >
              Solicitar Acceso a Hermes Runtime
            </Button>
          </div>
        </div>
      </section>

      {/* GLOBAL FOOTER */}
      <footer className="border-t border-zinc-800/50 bg-zinc-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-white font-bold text-lg tracking-widest flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Hermes Growth OS
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              by <span className="text-white">MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.</span>
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <button onClick={() => setLegalModalType('terms')} className="hover:text-white transition-colors">Términos y Condiciones</button>
            <button onClick={() => setLegalModalType('privacy')} className="hover:text-white transition-colors">Aviso de Privacidad</button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GrowthOSLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        tierName="Hermes Enterprise AI Infrastructure"
        source={modalSource}
      />
      <HermesLegalModals 
        isOpen={!!legalModalType} 
        onClose={() => setLegalModalType(null)} 
        type={legalModalType} 
      />
    </div>
  );
}
