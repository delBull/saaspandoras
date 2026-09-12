'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Bot, 
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
  TrendingUp
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
      const res = await fetch('/api/v1/portal/leads', {
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
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium tracking-wide text-[#D4AF37] uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Hermes Cognitive Conversion OS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1]">
            Hermes <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent">Revenue Closer</span>
          </h1>

          <p className="text-xl sm:text-2xl text-neutral-300 font-medium max-w-3xl">
            Tu equipo comercial inmobiliario, trabajando 24/7.
          </p>

          <p className="text-base sm:text-lg text-neutral-400 max-w-3xl leading-relaxed">
            Convierte WhatsApp, tu sitio web y tus campañas en una máquina de ventas que <span className="text-neutral-200 font-medium">responde, califica, da seguimiento, resuelve objeciones y agenda compradores listos</span> para hablar con tu equipo.
          </p>

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

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <a
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#AA771C] to-[#8C6215] text-black font-semibold text-base shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
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

        </div>
      </section>

      {/* The 3-Layer Architecture */}
      <section id="arquitectura" className="py-24 border-t border-white/5 bg-[#09090D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">Arquitectura de Operación</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              La diferencia está en nuestra Capa B
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg">
              La mayoría de las herramientas inmobiliarias se quedan en el CRM. Nosotros construimos una capa cognitiva encima de tu operación.
            </p>
          </div>

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

      {/* Visual Showcase Gallery */}
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

        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 border-t border-white/5 bg-gradient-to-b from-[#09090D] to-[#030305]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
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
                </div>
              </form>
            )}

          </div>

        </div>
      </section>
    </div>
  );
}
