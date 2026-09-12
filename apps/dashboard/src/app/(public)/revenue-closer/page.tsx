'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  FileText, 
  ChevronRight, 
  Briefcase, 
  Compass, 
  Award, 
  Flame, 
  Check, 
  Layers, 
  Users, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  Zap 
} from 'lucide-react';

export default function DashboardRevenueCloserPage() {
  const [formData, setFormData] = useState({
    name: '',
    projectName: '',
    email: '',
    whatsapp: '',
    projectType: 'desarrollo',
    unitCount: '10-50',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/v1/portal/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.whatsapp,
          source: 'revenue_closer_landing',
          metadata: {
            projectName: formData.projectName,
            projectType: formData.projectType,
            unitCount: formData.unitCount
          }
        })
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const conversionSteps = [
    {
      num: "01",
      title: "Tráfico Omnicanal",
      tag: "Entrada de Demanda",
      desc: "Prospectos captados desde pauta en Meta, Google Ads, portales inmobiliarios y enlaces de brokers.",
      icon: Radio,
      color: "from-blue-500/20 to-indigo-500/20 text-blue-400"
    },
    {
      num: "02",
      title: "Hermes Closer",
      tag: "Respuesta < 3s",
      desc: "Atención inmediata 24/7 en WhatsApp, Web Concierge o Telegram sin esperas ni fricción.",
      icon: Zap,
      color: "from-amber-500/20 to-yellow-500/20 text-amber-400"
    },
    {
      num: "03",
      title: "Identificación & Atribución",
      tag: "Deterministic Attribution",
      desc: "Resuelve interlocutor y sella la atribución persistente al broker referente sin disputas de comisión.",
      icon: ShieldCheck,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400"
    },
    {
      num: "04",
      title: "Calificación Cognitiva",
      tag: "Scoring en Vivo",
      desc: "Determina presupuesto real, horizonte de compra, tipo de unidad buscada y nivel de decisión.",
      icon: TrendingUp,
      color: "from-purple-500/20 to-violet-500/20 text-purple-400"
    },
    {
      num: "05",
      title: "Información & Data Room",
      tag: "Doctrina Aprobada",
      desc: "Despliega precios reales, inventario disponible, planos, fideicomiso y contratos sin alucinar.",
      icon: FileText,
      color: "from-amber-500/20 to-orange-500/20 text-amber-400"
    },
    {
      num: "06",
      title: "Seguimiento Cognitivo",
      tag: "Nurturing Reactivo",
      desc: "Reactivación multicanal por WhatsApp y Email cuando el prospecto se enfría, respetando quiet hours.",
      icon: Clock,
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-400"
    },
    {
      num: "07",
      title: "Cita de Cierre",
      tag: "Agenda Soberana",
      desc: "Agenda videollamadas en Google Meet o visitas al desarrollo directamente en los slots disponibles.",
      icon: Calendar,
      color: "from-emerald-500/20 to-green-500/20 text-emerald-400"
    },
    {
      num: "08",
      title: "Venta & Handoff Humano",
      tag: "Expediente Completo",
      desc: "El vendedor humano recibe reporte con objeciones resueltas, presupuesto y ángulo recomendado de cierre.",
      icon: Users,
      color: "from-rose-500/20 to-pink-500/20 text-rose-400"
    },
    {
      num: "09",
      title: "Aprendizaje Continuo",
      tag: "Feedback Loop",
      desc: "Cada conversación y objeción registrada retroalimenta el sistema para elevar la tasa de conversión.",
      icon: Cpu,
      color: "from-[#D4AF37]/20 to-amber-500/20 text-[#D4AF37]"
    }
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 selection:bg-amber-500 selection:text-black font-sans antialiased overflow-hidden">
      
      {/* Ambient Gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-amber-500/10 via-indigo-500/5 to-transparent blur-[160px] pointer-events-none" />
      <div className="fixed top-1/2 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[180px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[160px] pointer-events-none" />

      {/* Clean Navigation Header - Modeled on /growth-os */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-medium tracking-tight text-white">PANDORAS</span>
                <span className="text-xs text-amber-400 font-mono ml-2">Revenue Closer</span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-light">
            <a 
              href="#diagnostico" 
              onClick={(e) => scrollToSection(e, 'diagnostico')}
              className="hover:text-white transition-colors"
            >
              Diagnóstico
            </a>
            <a 
              href="#diferenciador" 
              onClick={(e) => scrollToSection(e, 'diferenciador')}
              className="hover:text-white transition-colors"
            >
              Diferenciador
            </a>
            <a 
              href="#arquitectura" 
              onClick={(e) => scrollToSection(e, 'arquitectura')}
              className="hover:text-white transition-colors"
            >
              Arquitectura
            </a>
            <a 
              href="#flujo" 
              onClick={(e) => scrollToSection(e, 'flujo')}
              className="hover:text-amber-400 transition-colors"
            >
              Flujo Cognitivo
            </a>
            <a 
              href="#audiencia" 
              onClick={(e) => scrollToSection(e, 'audiencia')}
              className="hover:text-white transition-colors"
            >
              Casos de Uso
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#demo"
              onClick={(e) => scrollToSection(e, 'demo')}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
            >
              <span>Solicitar Demo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 px-6 max-w-7xl mx-auto text-center">
        
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Autonomous Real Estate Closer · Hermes OS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white max-w-5xl mx-auto leading-[1.15] mb-8">
          Tu equipo comercial inmobiliario,<br />
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-normal">trabajando 24/7.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 font-light max-w-3xl mx-auto mb-10 leading-relaxed">
          Convierte WhatsApp, tu sitio web y tus campañas en una máquina de ventas que <span className="text-white font-normal">responde, califica, da seguimiento, resuelve objeciones y agenda compradores listos</span> para hablar con tu equipo.
        </p>

        {/* Value Pills */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-12 text-xs sm:text-sm text-zinc-300">
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sin perseguir leads fríos</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sin perder prospectos por falta de seguimiento</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sin depender de que un vendedor esté conectado</span>
          </div>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#demo"
            onClick={(e) => scrollToSection(e, 'demo')}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-8 py-4 rounded-xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Quiero convertir mi desarrollo en una máquina de ventas</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#flujo"
            onClick={(e) => scrollToSection(e, 'flujo')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all flex items-center justify-center gap-2"
          >
            <span>Ver flujo cognitivo de conversión</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </a>
        </div>

      </section>

      {/* Diagnóstico */}
      <section id="diagnostico" className="py-24 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">Diagnóstico de Mercado</span>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              El problema no es conseguir leads.<br />
              <span className="text-zinc-400 font-normal">Es convertirlos.</span>
            </h2>
            <p className="text-zinc-400 text-base font-light">
              Un desarrollo puede invertir miles de dólares en pauta digital y aun así perder ventas por cuellos de botella en la atención.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Respuesta tardía",
                desc: "El prospecto pregunta en la noche o en fin de semana y nadie responde a tiempo. La ventana de intención se evapora en minutos."
              },
              {
                icon: MessageSquare,
                title: "Falta de doctrina comercial",
                desc: "El vendedor desconoce la información técnica, legal o de disponibilidad exacta del inventario en ese instante."
              },
              {
                icon: Flame,
                title: "Enfriamiento prematuro",
                desc: "El lead se enfría inmediatamente después del primer contacto por falta de un protocolo sistemático de seguimiento."
              },
              {
                icon: Users,
                title: "Conflicto entre brokers",
                desc: "Múltiples agentes disputan el mismo comprador al no contar con un registro determinista y transparente de prospectos."
              },
              {
                icon: FileText,
                title: "Fricción documental",
                desc: "El comprador necesita revisar fideicomiso, permisos y planos antes de decidir, pero los documentos no están accesibles."
              },
              {
                icon: TrendingUp,
                title: "Ceguera de intención",
                desc: "El equipo comercial pierde tiempo en prospectos curiosos sin saber cuáles están listos para una llamada de cierre."
              }
            ].map((prob, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-amber-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                  <prob.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{prob.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">{prob.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Diferenciador */}
      <section id="diferenciador" className="py-24 border-t border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono">Diferenciador Radical</span>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              No somos otro chatbot.<br />
              <span className="text-zinc-400">Somos una capa de conversión para tu operación.</span>
            </h2>
            <p className="text-zinc-400 text-base font-light">
              Hermes entiende tu proyecto, tu inventario, tus precios, tus políticas y las reglas comerciales que tu dirección aprueba.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Modelo Tradicional */}
            <div className="p-8 rounded-3xl bg-zinc-950 border border-red-900/30 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-red-400 font-semibold">El Modelo Tradicional</span>
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xl font-medium text-white">Flujo Disperso con Pérdida de Leads</h3>
              
              <div className="space-y-3 text-xs text-zinc-300 font-light">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-zinc-800">
                  <span className="font-mono text-red-400 font-semibold">01</span>
                  <span>Lead entra por anuncio de Meta, Google o portal</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-zinc-800">
                  <span className="font-mono text-red-400 font-semibold">02</span>
                  <span>Vendedor responde horas después sin contexto del anuncio</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-zinc-800">
                  <span className="font-mono text-red-400 font-semibold">03</span>
                  <span>Seguimiento manual disperso en libretas o WhatsApp personal</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-zinc-800">
                  <span className="font-mono text-red-400 font-semibold">04</span>
                  <span>Incertidumbre: lead se enfría y no hay registro de objeciones</span>
                </div>
              </div>
              <p className="text-xs text-red-400/80 font-mono">Resultado: Fricción comercial y presupuesto publicitario desperdiciado.</p>
            </div>

            {/* Hermes Revenue Way */}
            <div className="p-8 rounded-3xl bg-zinc-950 border border-amber-500/40 space-y-6 shadow-2xl shadow-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold">Con Hermes Revenue Closer</span>
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-xl font-medium text-white">Máquina de Conversión Determinista</h3>
              
              <div className="space-y-3 text-xs text-zinc-200 font-light">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="font-mono text-amber-400 font-semibold">01</span>
                  <span>Lead entra por WhatsApp, Web o enlace de broker atribuido</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="font-mono text-amber-400 font-semibold">02</span>
                  <span>Hermes responde en &lt; 3 seg, califica presupuesto e intención real</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="font-mono text-amber-400 font-semibold">03</span>
                  <span>Resuelve objeciones con doctrina legal y entrega Data Room oficial</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="font-mono text-amber-400 font-semibold">04</span>
                  <span>Agenda cita en Google Meet y entrega lead al humano con contexto total</span>
                </div>
              </div>
              <p className="text-xs text-amber-400 font-mono">Resultado: Leads calificados, citas agendadas y tasa de conversión multiplicada.</p>
            </div>

          </div>

        </div>
      </section>

      {/* Arquitectura de 3 Capas */}
      <section id="arquitectura" className="py-24 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">Arquitectura Modular</span>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              La diferencia está en nuestra Capa B
            </h2>
            <p className="text-zinc-400 text-base font-light">
              Las herramientas tradicionales se limitan al CRM pasivo. Nosotros operamos una capa cognitiva activa encima de tu negocio.
            </p>
          </div>

          <div className="space-y-10">
            
            {/* CAPA A */}
            <div className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white font-mono text-sm font-semibold">A</div>
                  <div>
                    <h3 className="text-lg font-medium text-white">CAPA A — Tu Negocio</h3>
                    <p className="text-xs text-zinc-400 font-light">Tu desarrollo sigue siendo tuyo. No reemplazamos tu operación existente.</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-400">Infraestructura del Cliente</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2">
                {['Inventario & Unidades', 'Precios & Disponibilidad', 'Planes de Pago', 'Estructura Legal', 'Fideicomiso / Permisos', 'Fuerza de Ventas', 'Brokers Aliados', 'Campañas & Anuncios', 'CRM Existente', 'Reglas de Negocio'].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-black/50 border border-zinc-800/60 text-center text-xs text-zinc-300 font-light">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* CAPA B — HERMES REVENUE CLOSER */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/40 space-y-6 shadow-xl shadow-amber-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-mono text-sm font-bold">B</div>
                  <div>
                    <h3 className="text-xl font-medium text-white flex items-center gap-2">
                      CAPA B — Hermes Revenue Closer
                      <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">Core Cognitivo</span>
                    </h3>
                    <p className="text-xs text-zinc-300 font-light">La inteligencia comercial activa que conduce al prospecto hasta la decisión.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { step: "01", title: "Captura Omnicanal", desc: "WhatsApp, Web, campañas de pauta y enlaces atribuidos de brokers." },
                  { step: "02", title: "Identifica & Atribuye", desc: "Reconoce nuevo prospecto o broker, sellando la atribución sin colisiones." },
                  { step: "03", title: "Califica Intención", desc: "Evalúa presupuesto, horizonte de compra y nivel de decisión en tiempo real." },
                  { step: "04", title: "Conocimiento del Proyecto", desc: "Responde con inventario real, amenidades, avance de obra y precios oficiales." },
                  { step: "05", title: "Manejo de Objeciones", desc: "Doctrina legal y financiera para resolver dudas de plusvalía y certeza fiduciaria." },
                  { step: "06", title: "Seguimiento Cognitivo", desc: "Reactivación inteligente multicanal: WhatsApp, email y recordatorios." },
                  { step: "07", title: "Agenda con Compromiso", desc: "Mueve al prospecto hacia la llamada o videollamada en Google Meet." },
                  { step: "08", title: "Handoff Ejecutivo", desc: "Entrega al vendedor humano con resumen de presupuesto, objeciones y siguiente paso." }
                ].map((cap, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                    <span className="text-xs font-mono font-bold text-amber-400">{cap.step}</span>
                    <h4 className="text-sm font-medium text-white">{cap.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">{cap.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CAPA C */}
            <div className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white font-mono text-sm font-semibold">C</div>
                  <div>
                    <h3 className="text-lg font-medium text-white">CAPA C — Lo que Recibe tu Cliente</h3>
                    <p className="text-xs text-zinc-400 font-light">Infraestructura comercial y digital entregable para tu marca.</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-400">Entregables de Experiencia</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {[
                  { title: "Portal White-Label", desc: "Sitio web del proyecto con calculadoras y disponibilidad viva." },
                  { title: "Data Room Soberano", desc: "Bóveda para consultar fideicomiso, permisos y planos con total confianza." },
                  { title: "Broker Network Hub", desc: "Enlaces únicos por broker con atribución determinista de comisiones." },
                  { title: "Pipeline Comercial", desc: "Tablero de oportunidades con detección de puntos de fuga de ventas." },
                  { title: "Nurturing Automático", desc: "Secuencias reactivas por email y WhatsApp que mantienen el lead vivo." }
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-black/50 border border-zinc-800 space-y-1">
                    <h4 className="text-xs font-medium text-white">{item.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-light">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Flujo Cognitivo de Conversión */}
      <section id="flujo" className="py-24 border-t border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">Cadena de Valor Comercial</span>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Flujo Cognitivo de Conversión
            </h2>
            <p className="text-zinc-400 text-base font-light">
              Un recorrido cerrado donde cada paso reduce la fricción, califica la intención y conduce al comprador hacia la decisión.
            </p>
          </div>

          {/* Grid Flowchart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {conversionSteps.map((step, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/30 transition-all space-y-4 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-400 font-semibold">{step.num}</span>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {step.tag}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${step.color} border border-white/5`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-medium text-white">{step.title}</h3>
                </div>

                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  {step.desc}
                </p>

                {idx < conversionSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-zinc-600">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Connected Loop Banner */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-medium text-white flex items-center gap-2 justify-center sm:justify-start">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Ciclo de Aprendizaje Comercial Cerrado</span>
              </h4>
              <p className="text-xs text-zinc-400 font-light">
                Cada objeción y resultado de cita afina la doctrina de venta para aumentar la probabilidad de cierre del siguiente lead.
              </p>
            </div>
            <a
              href="#demo"
              onClick={(e) => scrollToSection(e, 'demo')}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors whitespace-nowrap"
            >
              Conectar a mi desarrollo
            </a>
          </div>

        </div>
      </section>

      {/* Casos de Uso */}
      <section id="audiencia" className="py-24 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">Audiencia Objetivo</span>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Para quién es Hermes Revenue Closer
            </h2>
            <p className="text-zinc-400 text-base font-light">
              Diseñado para organizaciones y comercializadoras de inventario inmobiliario de alto ticket.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: "Desarrolladores Inmobiliarios",
                desc: "Cuando tienes inventario en preventa o entrega inmediata y necesitas convertir pauta en citas de forma predecible."
              },
              {
                icon: Briefcase,
                title: "Agencias Inmobiliarias",
                desc: "Cuando administras múltiples desarrollos y necesitas distribuir leads calificados a tus asesores con contexto total."
              },
              {
                icon: Users,
                title: "Equipos de Brokers & Master Brokers",
                desc: "Cuando requieres trazabilidad garantizada para proteger comisiones y eliminar disputas entre agentes."
              },
              {
                icon: Compass,
                title: "Desarrollos Turísticos y Vacacionales",
                desc: "Cuando el comprador foráneo o extranjero necesita certeza fiduciaria, números claros y confianza antes de reservar."
              },
              {
                icon: Award,
                title: "Proyectos de Alta Gama & RWA",
                desc: "Cuando cada prospecto representa un ticket elevado y perder un lead por falta de atención oportuna cuesta miles de dólares."
              },
              {
                icon: Layers,
                title: "Master Developers de Tierra / Lotes",
                desc: "Cuando comercializas etapas de urbanización con esquemas de financiamiento directo y requieres calcular corridas 24/7."
              }
            ].map((aud, i) => (
              <div key={i} className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <aud.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-medium text-white">{aud.title}</h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">{aud.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Sinergia Humano + IA */}
      <section className="py-20 border-t border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono">Eficiencia Aumentada</span>
          <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
            Tu equipo no desaparece.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Se concentra exclusivamente en cerrar.</span>
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed">
            Hermes elimina las tareas repetitivas y el desgaste de responder lo mismo cientos de veces. Atiende, califica, informa y agenda. Tu equipo entra cuando la conversación tiene máximo valor.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs font-light">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">Hermes atiende</div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">Hermes califica</div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">Hermes informa</div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">Hermes da seguimiento</div>
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold col-span-2 sm:col-span-1">Tu equipo cierra</div>
          </div>
        </div>
      </section>

      {/* Demo / Form */}
      <section id="demo" className="py-24 border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-[#070709]">
        <div className="max-w-3xl mx-auto px-6">
          
          <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            
            <div className="space-y-3 mb-8 text-center sm:text-left">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">Demostración Personalizada</span>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                Convierte tu desarrollo en una máquina de ventas
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-light">
                Configuramos una demostración con las reglas, inventario y doctrina de tu desarrollo inmobiliario.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-white">Solicitud Recibida con Éxito</h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto font-light">
                  Nuestro equipo de arquitectura comercial se pondrá en contacto contigo vía WhatsApp para coordinar tu sesión de demostración.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300 font-light">Nombre completo</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Carlos Mendoza"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300 font-light">Nombre del Desarrollo / Inmobiliaria</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Residencial Punta Bahía"
                      value={formData.projectName}
                      onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300 font-light">WhatsApp directo</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+52 1 ..."
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300 font-light">Correo electrónico corporativo</label>
                    <input 
                      type="email" 
                      required
                      placeholder="carlos@desarrollo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300 font-light">Tipo de Proyecto</label>
                    <select 
                      value={formData.projectType}
                      onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                    >
                      <option value="desarrollo">Desarrollo Vertical / Departamentos</option>
                      <option value="lotes">Lotes / Masterplan de Tierra</option>
                      <option value="vacacional">Turístico / Vacacional / Rentas</option>
                      <option value="rwa">Propiedad Fraccional / RWA</option>
                      <option value="agencia">Agencia Inmobiliaria Multidesarrollo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300 font-light">Volumen aproximado de unidades</label>
                    <select 
                      value={formData.unitCount}
                      onChange={(e) => setFormData({...formData, unitCount: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                    >
                      <option value="1-15">1 a 15 unidades</option>
                      <option value="16-50">16 a 50 unidades</option>
                      <option value="51-200">51 a 200 unidades</option>
                      <option value="200+">Más de 200 unidades</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    {isSubmitting ? (
                      <span>Procesando solicitud...</span>
                    ) : (
                      <>
                        <span>Solicitar Demostración Comercial</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-zinc-500 mt-2 font-light">
                    Tus datos se manejan bajo estricta confidencialidad fiduciaria. Sin spam.
                  </p>
                </div>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* Clean Footer - Modeled on /growth-os */}
      <footer className="py-16 border-t border-zinc-800/80 bg-zinc-950 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-4 py-1.5 rounded-full font-mono">
            <span>Pandoras Growth OS — The Autonomous Enterprise Platform</span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-light text-white">
            Construye la infraestructura de conversión que tu desarrollo necesita.
          </h3>

          <div className="pt-2">
            <a
              href="#demo"
              onClick={(e) => scrollToSection(e, 'demo')}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10"
            >
              <span>Solicitar Acceso a Hermes Closer</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="pt-8 border-t border-zinc-900 text-xs text-zinc-500 font-light flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Pandoras Growth OS. Todos los derechos reservados.</p>
            <p className="text-zinc-600 font-mono text-[11px]">Hermes Cognitive Revenue Engine</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
