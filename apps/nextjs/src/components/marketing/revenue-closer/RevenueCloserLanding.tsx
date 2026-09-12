'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Layers, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  FileText, 
  ChevronRight, 
  Send, 
  Key, 
  Briefcase, 
  Compass, 
  Award,
  Flame,
  Check
} from 'lucide-react';

export function RevenueCloserLanding({ lang = 'es' }: { lang?: string }) {
  const [formData, setFormData] = useState({
    name: '',
    projectName: '',
    email: '',
    whatsapp: '',
    projectType: 'desarrollo',
    unitCount: '10-50',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission or connect to portal leads API
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const imagesShowcase = [
    {
      title: "Pipeline Comercial & Decisiones en Tiempo Real",
      desc: "Visibilidad integral desde la primera interacción en WhatsApp hasta la cita de cierre.",
      url: "https://images.openai.com/static-rsc-4/sK2ugWU0lXvoxSFu1vNXPj9jE2WyL8b2ySOMUgnvjEa9eyWjaANfHdmL3EulnBc6O8ys9-TppGiLsWWUQLHRIzil3PD9s2Nv8uiprSATnKQ3aff0eBnqcYGM0O1gBs2VUowdxbGpjTZ82K3rhWHt62NcgF89c8R66Xm5eAbqI_LSdbXLJ0A8o4h06sMyuImv?purpose=fullsize"
    },
    {
      title: "Hermes Concierge & Calificación 24/7",
      desc: "Conversaciones fluidas basadas en la doctrina técnica, legal y comercial aprobada por tu desarrollo.",
      url: "https://images.openai.com/static-rsc-4/7raIS8-NYf_bA1nTrelt7i5ydXW8OqU-dAQgVIZRkmcjYSc1YO-2i-syJJjIMEWI6AxkLaEv9-0ju-UZNnFaMHoQIyfAYn4qwdalFij_ynFgSRjeCc6bzuyOF17J1zFQeltPKCYc6kZrZNUDqh6MGCUQnT4munRqY-EY7bPv_spNlkm2gOVuw3PqfcttK-ZP?purpose=fullsize"
    },
    {
      title: "Data Room & Centro Documental Verificado",
      desc: "Acceso controlado a fideicomisos, permisos, planos y contratos con certeza y transparencia.",
      url: "https://images.openai.com/static-rsc-4/GZHA-EfqUqnWAfwEucVITMf-HZ_ANMvjpmLSwS8jWAo_C8fcCzRSvT4p562CFYokF7O4YGnCHepjN2O-Ea6MB1Usgt8wTZCBXEWCW5UPknTnWXx_88HkPe3W9y7RpR4oAS5TBQ-Pfp8coanPa8F1JAeE9tEX90z6t_5hCeJ95RBKdz7OaTOus0PEINJYVg9b?purpose=fullsize"
    },
    {
      title: "Broker Network Hub & Atribución Determinista",
      desc: "Cada asesor comercial tiene su enlace exclusivo y trazabilidad garantizada sin disputas.",
      url: "https://images.openai.com/static-rsc-4/76kMj_lyE39L30EXb5ef8rUsEIQiJmyaP14uj3rYiC8yO0cERRSApRDww1rjslnBr7XTwFJ6wiML-kYUv0XYTLXZ6n6vhWxoIOh1Qrb7QzuLz1J4pZmTrZ1cjBvX7OWpzVasyGFylC7IYi1QqKEig8YshDAiPMDBtwQj4Re9jbMCW7dmsFQose4mYjwJ3RoT?purpose=fullsize"
    },
    {
      title: "Portal White-Label del Proyecto",
      desc: "Experiencia institucional de marca con calculadoras de plusvalía y disponibilidad viva.",
      url: "https://images.openai.com/static-rsc-4/FYklVOdTvZmughcw7KLQw-AolMCUnWFGXe72dBguicDf90uqVEcZtdGLZbuAp1LoCvnCb1wlWvXAFAbT8jdQi0DBMOznEtPucyMXsSW0U1s0gSwlQJDc35hVbc4rbeY-Te2E-15Tha1EMgHheghwKqGryc5i4DmP8Wtt13jtch5cxoH3Ei-jeHyryGuVg39X?purpose=fullsize"
    },
    {
      title: "Nurturing Cognitivo & Conversión Asistida",
      desc: "Reactivación de prospectos indecisos con información oportuna en WhatsApp, email y llamadas.",
      url: "https://images.openai.com/static-rsc-4/Wxo68hU-Q24R4W5J5nkNlpYizI1H7KTSJcsdH7UbTrO0-WRYI6EoYH7urvjan6Nac8aAFZ3ItNQtwBLWacvWJGo7IpG72XNJrNkiOwRkJdB5D9P1DMmCFB4ONLqbbVT6Xx1YfI-AnytRT_ne1kIOtJt5SxkIVwCa0IkPwVQcanNyv2fU9uzS04kIoyL4GKwv?purpose=fullsize"
    }
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 selection:bg-[#D4AF37]/30 selection:text-white font-sans antialiased overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-bl from-[#D4AF37]/10 via-[#B38728]/5 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-[160px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium tracking-wide text-[#D4AF37] uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Hermes Cognitive Conversion OS</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1]">
            Hermes <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent">Revenue Closer</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-neutral-300 font-medium max-w-3xl">
            Tu equipo comercial inmobiliario, trabajando 24/7.
          </p>

          {/* Core Hook Narrative */}
          <p className="text-base sm:text-lg text-neutral-400 max-w-3xl leading-relaxed">
            Convierte WhatsApp, tu sitio web y tus campañas en una máquina de ventas que <span className="text-neutral-200 font-medium">responde, califica, da seguimiento, resuelve objeciones y agenda compradores listos</span> para hablar con tu equipo.
          </p>

          {/* Value Prop Bullet Pills */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-2 text-sm text-neutral-300">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sin perseguir leads fríos</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sin perder prospectos por falta de seguimiento</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sin depender de que un vendedor esté conectado</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <a
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#AA771C] to-[#8C6215] text-black font-semibold text-base shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>Quiero convertir mi desarrollo en una máquina de ventas</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#arquitectura"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.05] border border-white/10 text-neutral-200 font-medium text-base hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
            >
              <span>Ver cómo opera en vivo</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </a>
          </div>

        </div>
      </section>

      {/* The Real Problem Section */}
      <section className="py-20 border-t border-white/5 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">Diagnóstico de Mercado</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              El problema no es conseguir leads.<br />
              <span className="text-neutral-400">Es convertirlos.</span>
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg">
              Un desarrollo puede invertir miles de dólares en tráfico y aun así perder ventas por fallas sistémicas en la cadena de atención.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Respuesta tardía",
                desc: "El prospecto pregunta a las 9:00 PM o en fin de semana y nadie responde a tiempo. La ventana de interés expira en minutos."
              },
              {
                icon: MessageSquare,
                title: "Falta de doctrina comercial",
                desc: "El vendedor improvisa o desconoce la información técnica, legal o de disponibilidad exacta en ese momento."
              },
              {
                icon: Flame,
                title: "Enfriamiento prematuro",
                desc: "El lead se enfría inmediatamente después del primer mensaje porque no hay seguimiento estructurado."
              },
              {
                icon: Users,
                title: "Conflicto de atribución entre brokers",
                desc: "Múltiples agentes compiten por el mismo comprador al no contar con un registro determinista y transparente de prospectos."
              },
              {
                icon: FileText,
                title: "Fricción documental",
                desc: "El comprador necesita revisar fideicomiso, permisos y planos antes de decidir, pero los documentos están dispersos o desactualizados."
              },
              {
                icon: TrendingUp,
                title: "Ceguera de intención",
                desc: "El equipo comercial pierde tiempo en prospectos curiosos sin saber cuáles están realmente listos para una llamada de cierre."
              }
            ].map((problem, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-red-500/20 transition-all hover:bg-white/[0.04] group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:scale-105 transition-transform">
                  <problem.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{problem.desc}</p>
              </div>
            ))}
          </div>

          {/* Transition Banner */}
          <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 via-emerald-500/10 to-transparent border border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-bold text-white">Hermes trabaja sobre todo ese recorrido</h4>
              <p className="text-sm text-neutral-300">Elimina los puntos ciegos y acompaña al prospecto de forma persistente hasta la toma de decisión.</p>
            </div>
            <a 
              href="#demo"
              className="px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors whitespace-nowrap"
            >
              Implementar en mi proyecto
            </a>
          </div>

        </div>
      </section>

      {/* Comparison: Not Just Another Chatbot */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Diferenciador Radical</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              No somos otro chatbot.<br />
              <span className="text-neutral-400">Somos una capa de conversión para tu operación.</span>
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg">
              Hermes entiende tu proyecto, tu inventario, tus precios, tus políticas, tus documentos y las reglas que tu dirección comercial haya aprobado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* The Traditional Way */}
            <div className="p-8 rounded-3xl bg-red-950/10 border border-red-900/30 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-red-400">El Modelo Tradicional</span>
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Flujo Ineficiente & Disperso</h3>
              
              <div className="space-y-4 text-sm text-neutral-300">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-red-900/20">
                  <span className="font-mono text-red-400">01</span>
                  <span>Lead entra por anuncio de Meta o Google</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-red-900/20">
                  <span className="font-mono text-red-400">02</span>
                  <span>Vendedor responde horas después sin contexto</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-red-900/20">
                  <span className="font-mono text-red-400">03</span>
                  <span>Seguimiento manual esporádico en notas o WhatsApp</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-red-900/20">
                  <span className="font-mono text-red-400">04</span>
                  <span>Incertidumbre: lead se enfría y no hay registro de objeciones</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                Resultado: 80% del presupuesto de marketing se pierde en fricción operativa.
              </div>
            </div>

            {/* The Hermes Revenue Way */}
            <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-6 relative overflow-hidden shadow-2xl shadow-emerald-950/50">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Con Hermes Revenue Closer</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Máquina de Conversión Determinista</h3>

              <div className="space-y-4 text-sm text-neutral-200">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                  <span className="font-mono text-emerald-400 font-bold">01</span>
                  <span>Lead entra por WhatsApp, Web o Broker atribuido</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                  <span className="font-mono text-emerald-400 font-bold">02</span>
                  <span>Hermes atiende en &lt; 3 seg, califica presupuesto e intención</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                  <span className="font-mono text-emerald-400 font-bold">03</span>
                  <span>Resuelve objeciones con doctrina legal y entrega Data Room</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                  <span className="font-mono text-emerald-400 font-bold">04</span>
                  <span>Agenda videollamada de cierre y entrega al humano con reporte completo</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
                Resultado: Prospectos calificados, citas agendadas y tasa de conversión multiplicada.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* The 3-Layer Architecture Section (Capa A, Capa B, Capa C) */}
      <section id="arquitectura" className="py-24 border-t border-white/5 bg-[#09090D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">Arquitectura de Operación</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              La diferencia está en nuestra Capa B
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg">
              La mayoría de las herramientas inmobiliarias se quedan en un simple CRM pasivo. Nosotros operamos una capa cognitiva activa encima de tu negocio.
            </p>
          </div>

          {/* 3 Layers Stack */}
          <div className="space-y-12">
            
            {/* CAPA A */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">A</div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">CAPA A — Tu Negocio</h3>
                    <p className="text-sm text-neutral-400">Tu desarrollo sigue siendo tuyo. No reemplazamos tu operación existente.</p>
                  </div>
                </div>
                <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-mono">Infraestructura del Cliente</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                {['Inventario & Unidades', 'Precios & Disponibilidad', 'Planes de Pago', 'Estructura Legal', 'Fideicomiso / Escrituras', 'Equipo Comercial', 'Brokers Aliados', 'Marketing & Tráfico', 'CRM Existente', 'Reglas de Negocio'].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 text-center text-xs text-neutral-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* CAPA B — HERMES REVENUE CLOSER */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#D4AF37]/10 via-black/80 to-black border-2 border-[#D4AF37]/40 space-y-8 relative shadow-2xl shadow-[#D4AF37]/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6215] flex items-center justify-center text-black font-bold">B</div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      CAPA B — Hermes Revenue Closer
                      <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-normal">Core del Producto</span>
                    </h3>
                    <p className="text-sm text-neutral-300">La inteligencia comercial activa que orquesta todo el embudo.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: "01",
                    title: "Captura Omnicanal",
                    desc: "WhatsApp, Web, campañas de pauta, enlaces de brokers atribuidos y formularios."
                  },
                  {
                    step: "02",
                    title: "Identifica & Atribuye",
                    desc: "Reconoce si es nuevo prospecto, comprador recurrente o broker, preservando el contexto."
                  },
                  {
                    step: "03",
                    title: "Califica Intención",
                    desc: "Detecta presupuesto, horizonte de compra, tipo de unidad, nivel de decisión y urgencia."
                  },
                  {
                    step: "04",
                    title: "Conocimiento de Proyecto",
                    desc: "No alucina. Responde con inventario real, amenidades, avance de obra y precios autorizados."
                  },
                  {
                    step: "05",
                    title: "Manejo de Objeciones",
                    desc: "Resuelve dudas de plusvalía, cesión de derechos, fideicomiso y contratos con doctrina legal aprobada."
                  },
                  {
                    step: "06",
                    title: "Seguimiento Continuo",
                    desc: "Reactivación inteligente multicanal: WhatsApp, email, entrega de dossier y recordatorios."
                  },
                  {
                    step: "07",
                    title: "Agenda con Compromiso",
                    desc: "Mueve al prospecto hacia la llamada, videollamada en Google Meet o visita guiada al desarrollo."
                  },
                  {
                    step: "08",
                    title: "Handoff Ejecutivo",
                    desc: "Entrega al vendedor humano con resumen de presupuesto, objeciones y siguiente paso recomendado."
                  }
                ].map((cap, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <span className="text-xs font-mono font-bold text-[#D4AF37]">{cap.step}</span>
                    <h4 className="text-sm font-semibold text-white">{cap.title}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{cap.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CAPA C */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">C</div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">CAPA C — Lo que Recibe tu Cliente</h3>
                    <p className="text-sm text-neutral-400">Infraestructura comercial y digital entregable para tu marca.</p>
                  </div>
                </div>
                <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-mono">Entregables de Experiencia</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    title: "Portal White-Label",
                    desc: "Sitio institucional del proyecto con calculadoras interactivas y disponibilidad en vivo."
                  },
                  {
                    title: "Data Room Soberano",
                    desc: "Centro documental para revisar contratos, fideicomiso y permisos con total confianza."
                  },
                  {
                    title: "Broker Network Hub",
                    desc: "Enlaces personalizados con atribución persistente de comisiones sin disputas."
                  },
                  {
                    title: "Pipeline Comercial",
                    desc: "Tablero de oportunidades con detección de puntos de fricción donde se pierden ventas."
                  },
                  {
                    title: "Nurturing Automático",
                    desc: "Secuencias reactivas por email y WhatsApp que mantienen los prospectos vivos."
                  }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Visual Image Showcase Gallery */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">Galería Operativa</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Y todo esto trabaja junto en una sola plataforma
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg">
              Desde el primer clic de un anuncio hasta el recibo transaccional de compra y la liquidación de comisiones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {imagesShowcase.map((card, idx) => (
              <div key={idx} className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden group hover:border-[#D4AF37]/30 transition-all">
                <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                  <img 
                    src={card.url} 
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-base font-semibold text-white">{card.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Step-by-Step Chain */}
          <div className="mt-16 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-medium">
              <span className="text-neutral-400">Tráfico</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <span className="text-[#D4AF37] font-semibold">Hermes Closer</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <span className="text-neutral-300">Identificación</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <span className="text-neutral-300">Calificación</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <span className="text-neutral-300">Información</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <span className="text-neutral-300">Seguimiento</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <span className="text-emerald-400 font-semibold">Cita de Cierre</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <span className="text-white font-bold">Venta</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <span className="text-[#D4AF37] font-semibold">Aprendizaje Continuo</span>
            </div>
          </div>

        </div>
      </section>

      {/* Target Audience / Para Quién Es Hermes */}
      <section className="py-20 border-t border-white/5 bg-[#09090D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">Audiencia Objetivo</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Para quién es Hermes Revenue Closer
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg">
              Diseñado específicamente para organizaciones que comercializan inventario inmobiliario de alto valor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: "Desarrolladores Inmobiliarios",
                desc: "Cuando tienes inventario que necesitas convertir en ventas de manera constante sin aumentar el costo fijo de ventas."
              },
              {
                icon: Briefcase,
                title: "Agencias Inmobiliarias",
                desc: "Cuando administras múltiples propiedades, equipos de asesores y diversas fuentes de tráfico publicitario."
              },
              {
                icon: Users,
                title: "Equipos y Redes de Brokers",
                desc: "Cuando necesitas distribuir oportunidades, evitar disputas de comisión y garantizar trazabilidad en cada cierre."
              },
              {
                icon: Compass,
                title: "Desarrollos Turísticos y Vacacionales",
                desc: "Cuando el comprador foráneo requiere más información, confianza, respaldo legal y seguimiento antes de reservar."
              },
              {
                icon: Award,
                title: "Proyectos de Alta Gama y RWA",
                desc: "Cuando cada lead representa un ticket de alto valor y no puedes permitirte perder ventas por falta de respuesta oportuna."
              },
              {
                icon: Layers,
                title: "Master Developers & Fondos",
                desc: "Cuando operas múltiples fases o desarrollos en paralelo y requieres estandarizar la doctrina comercial en toda la firma."
              }
            ].map((audience, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                  <audience.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{audience.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{audience.desc}</p>
              </div>
            ))}
          </div>

          {/* Versatility of Inventory */}
          <div className="mt-12 p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-4">
            <h4 className="text-xl sm:text-2xl font-bold text-white">
              No importa si vendes 10 propiedades o 1,000 unidades
            </h4>
            <p className="text-neutral-400 max-w-3xl mx-auto text-sm sm:text-base">
              Hermes se adapta a tu modelo: <span className="text-neutral-200">Venta tradicional · Preventa · Lotes de urbanización · Departamentos premium · Proyectos vacacionales · Pool de rentas · Esquemas patrimoniales y RWA fraccional.</span>
            </p>
          </div>

        </div>
      </section>

      {/* Team Empowerment Section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Sinergia Humano + IA</span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Tu equipo no desaparece.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Se vuelve exponencialmente más eficiente.</span>
          </h2>
          <p className="text-neutral-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            Hermes no pretende reemplazar al director comercial, al broker ni al asesor inmobiliario. Hace algo mucho más valioso: <span className="text-white font-medium">elimina todo el trabajo repetitivo y tedioso para que ellos se concentren exclusivamente en lo que mejor hacen: cerrar.</span>
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">Hermes atiende</div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">Hermes califica</div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">Hermes informa</div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">Hermes da seguimiento</div>
            <div className="p-4 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold col-span-2 sm:col-span-1">Tu equipo cierra</div>
          </div>
        </div>
      </section>

      {/* Demo / Lead Capture Section */}
      <section id="demo" className="py-24 border-t border-white/5 bg-gradient-to-b from-[#09090D] to-[#030305]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-3xl pointer-events-none rounded-full" />
            
            <div className="space-y-4 mb-8 text-center sm:text-left">
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">Transformación Comercial</span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Convierte tu desarrollo en una máquina de ventas
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base">
                Solicita una demostración personalizada con el inventario y reglas de tu desarrollo inmobiliario.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Solicitud Recibida</h3>
                <p className="text-sm text-neutral-300 max-w-md mx-auto">
                  Hemos registrado tus datos. Nuestro equipo de arquitectura comercial se pondrá en contacto contigo vía WhatsApp para coordinar tu sesión de demostración.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-300 font-medium">Nombre completo</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Carlos Mendoza"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#D4AF37] text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-300 font-medium">Nombre del Desarrollo / Inmobiliaria</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Residencial Punta Bahía"
                      value={formData.projectName}
                      onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#D4AF37] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-300 font-medium">WhatsApp directo</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+52 1 ..."
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#D4AF37] text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-300 font-medium">Correo electrónico corporativo</label>
                    <input 
                      type="email" 
                      required
                      placeholder="carlos@desarrollo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#D4AF37] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-300 font-medium">Tipo de Proyecto</label>
                    <select 
                      value={formData.projectType}
                      onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                    >
                      <option value="desarrollo">Desarrollo Vertical / Departamentos</option>
                      <option value="lotes">Lotes / Masterplan de Tierra</option>
                      <option value="vacacional">Turístico / Vacacional / Rentas</option>
                      <option value="rwa">Propiedad Fraccional / RWA</option>
                      <option value="agencia">Agencia Inmobiliaria Multidesarrollo</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-300 font-medium">Volumen aproximado de unidades</label>
                    <select 
                      value={formData.unitCount}
                      onChange={(e) => setFormData({...formData, unitCount: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
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
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#AA771C] to-[#8C6215] text-black font-bold text-base shadow-xl shadow-[#D4AF37]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        <span>Solicitar Demo de Conversión Inmobiliaria</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-neutral-500 mt-3">
                    Tus datos se manejan bajo estricta confidencialidad fiduciaria. Sin spam.
                  </p>
                </div>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* Footer Quote */}
      <div className="py-12 text-center text-xs text-neutral-500 border-t border-white/5">
        <p>Hermes Revenue Closer · Pandoras Growth OS · Todos los derechos reservados</p>
      </div>

    </div>
  );
}
