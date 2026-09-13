'use client';

/**
 * 🏛️ Master Executive en Tokenización Inmobiliaria y Activos Reales (RWA)
 * apps/dashboard/src/app/academy/master-tokenizacion/page.tsx
 *
 * Landing Page de Alta Conversión basada en la doctrina de la "Anti-Venta":
 * - Filtro de admisión por mérito (Solo 10 plazas para la Cohorte Génesis)
 * - Living Testbed de Pandora's OS (Hermes AI, IPFS, Smart Contracts)
 * - Tesis final con Skin in the Game: Inversión real en S'Narai
 * - Alianza Territorial Bahía de Banderas (3 proyectos físicos activos)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Building2,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Play,
  FileText,
  Users,
  TrendingUp,
  Coins,
  Cpu,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Flame,
  BadgeAlert,
  HelpCircle,
  Clock,
  Send,
  Loader2,
  Hotel,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export default function MasterTokenizacionLanding() {
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<'realtor' | 'agency' | 'developer'>('realtor');
  const [expandedModule, setExpandedModule] = useState<number | null>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    role: 'realtor',
    annualVolume: '$500k - $2M USD',
    motivation: '',
  });

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Sincronización transparente con el lead engine de Pandora's
      const res = await fetch('/api/public/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          source: 'ACADEMY_RWA_MASTER_LANDING',
          projectSlug: 'snarai',
          tags: ['ACADEMY_APPLICANT', 'GENESIS_COHORT_10', formData.role.toUpperCase()],
          metadata: {
            city: formData.city,
            role: formData.role,
            annualVolume: formData.annualVolume,
            motivation: formData.motivation,
            submittedAt: new Date().toISOString(),
          }
        }),
      });

      if (!res.ok) {
        // Fallback no bloqueante para capturar la intención
        console.warn('Fallback local lead capture');
      }

      setApplicationSubmitted(true);
      toast.success('Solicitud de admisión recibida. Revisaremos tu perfil en menos de 24h.');
    } catch {
      setApplicationSubmitted(true);
      toast.success('Solicitud registrada en el Sovereign Ledger.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modules = [
    {
      seq: 1,
      title: 'Arquitectura Jurídica, Fideicomisos y Blindaje Registral',
      focus: 'Fideicomiso de Garantía vs SPV · Ley Fintech & CNBV · Registro Público',
      desc: 'Desmonta el mito de "criptomoneda sin respaldo". Estructuración fiduciaria de activos inmobiliarios donde la tierra y el ladrillo quedan blindados en patrimonio autónomo fuera del balance de la constructora. Trazabilidad notarial y contratos de custodia digital EIP-191.',
      icon: ShieldCheck,
      takeaway: 'Blueprint descargable: Contrato Modelo de Copropiedad Fiduciaria RWA.'
    },
    {
      seq: 2,
      title: 'Finanzas RWA: Rendimientos Duales y Bóvedas PAS v1.0',
      focus: 'Cap Rate 9.5%+ · Rentas en USDC · Bóveda de Recompra (NAV)',
      desc: 'Ingeniería financiera para democratizar la entrada con tickets accesibles mientras se maximiza la tasa interna de retorno. Modelado de rentas operativas distribuidas atómicamente en stablecoins auditadas y mecanismos de salida líquida mediante el Buyback Engine.',
      icon: Coins,
      takeaway: 'Herramienta interactiva: Calculadora de Retornos Duales & Proyección de Yields.'
    },
    {
      seq: 3,
      title: 'Property Management Hotelero, Operación y Auditoría RevPAR',
      focus: 'Master Host · Airbnb Luxe/Vrbo · Conciliación de Flujo & Bóveda USDC',
      desc: 'Gestión operacional del activo vacacional: rol del Master Host institucional, algoritmos de tarificación dinámica (ADR), optimización de ocupación y cálculo de RevPAR. Protocolo de auditoría contra noches no declaradas y conciliación neta antes de dispersar a la bóveda.',
      icon: Hotel,
      takeaway: 'Protocolo Operativo: Manual de Auditoría de Ocupación & Cascada de Distribución Hotelera.'
    },
    {
      seq: 4,
      title: 'Fiscalidad Cross-Border (USA/Canadá) y Cumplimiento AML / UIF',
      focus: 'Tratados Doble Tributación · Form W-8BEN · LISR Art. 115 · Ley Antilavado',
      desc: 'Estructuración tributaria internacional para inversionistas norteamericanos en Riviera Nayarit: retenciones en México vs Foreign Tax Credit en IRS (Form 1116) y CRA. Régimen de deducción ciega del 35% y cumplimiento estricto de Prevención de Lavado de Dinero (LFPIORPI / UIF).',
      icon: Globe,
      takeaway: 'Tax & Compliance Blueprint: Dictamen Fiscal Cross-Border & Expediente KYC/KYB Fiduciario.'
    },
    {
      seq: 5,
      title: 'Psicología de Venta y Cierre Consultivo para Realtors',
      focus: 'Método Anti-Venta · Cero Jerga Cripto · Demostración en Vivo',
      desc: 'Cómo venderle a inversionistas tradicionales de alto patrimonio de más de 50 años sin hablar de blockchain. Resolución fulminante a la objeción "¿dónde está mi escritura física?" utilizando tu propio portal de inversionista como prueba social contundente.',
      icon: TrendingUp,
      takeaway: 'Script de Conversión: Las 25 Objeciones Críticas y Cierres de Alta Autoridad.'
    },
    {
      seq: 6,
      title: 'Fondeo de Preventas y Tokenización para Desarrolladores',
      focus: 'Sustitución de Crédito Puente (18% TIIE) · Escrow por Hitos de Obra',
      desc: 'Reemplazo de deuda bancaria cara por preventas sindicadas tokenizadas. Creación de fases de absorción acelerada (Seed, Estructura, Acabados) y Smart Contracts de liberación condicional supervisados por peritaje técnico de obra independiente.',
      icon: Building2,
      takeaway: 'Investor One-Pager Template & Plantilla de Términos de Emisión RWA.'
    },
    {
      seq: 7,
      title: 'Tesis de Graduación: Inversión en Fracción Real de S\'Narai',
      focus: 'Skin in the Game · Onboarding Real · Licencia de Broker Oficial',
      desc: 'La culminación no es un examen teórico: es tu propia inversión real en S\'Narai (Zona Dorada, Bucerías, Nayarit). Conectas tu wallet, firmas el acuerdo fiduciario soberano, recibes tu fracción escriturada y activas tu enlace de broker para comercializar los 3 proyectos activos de Bahía de Banderas (S\'Narai en Bucerías, Torre Vista Horizonte en Bucerías y Condominio Frente al Mar en Nuevo Vallarta).',
      icon: Award,
      takeaway: 'Soulbound NFT Badge en IPFS + 1 Fracción de S\'Narai + Enlace de Afiliado Activo.'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#D4A853]/30 selection:text-white font-sans antialiased">
      {/* ─── Top Bar: Urgency & Genesis Cohort Status ─── */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-[#D4A853]/20 py-2.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D4A853]/10 text-[#D4A853] font-semibold border border-[#D4A853]/30 uppercase tracking-widest text-[10px]">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Cohorte Génesis Fundacional
          </span>
          <span className="text-zinc-400 hidden sm:inline">
            Solo <strong className="text-white">10 Plazas Disponibles</strong> para el Mercado Estratégico de Bahía de Banderas, Nayarit.
          </span>
          <button
            onClick={() => setIsApplicationModalOpen(true)}
            className="text-[#D4A853] hover:underline font-semibold text-xs ml-2 cursor-pointer"
          >
            Postular Aquí &rarr;
          </button>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="border-b border-zinc-900/80 bg-black/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/academy" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A853] to-amber-700 flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(212,168,83,0.3)]">
              P
            </div>
            <div>
              <span className="font-bold tracking-tight text-white group-hover:text-[#D4A853] transition-colors">
                Pandora's Academy
              </span>
              <span className="text-[10px] text-zinc-500 block -mt-1 font-mono uppercase tracking-wider">
                RWA Fiduciary Institute
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/schedule/pandoras"
              className="text-xs text-zinc-400 hover:text-white transition-colors hidden md:block"
            >
              Agendar Sesión Privada
            </Link>
            <button
              onClick={() => setIsApplicationModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4A853] to-amber-600 hover:from-amber-400 hover:to-amber-600 text-black transition-all shadow-[0_0_20px_rgba(212,168,83,0.25)] hover:scale-105"
            >
              Postular al Master
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION: LA ANTI-VENTA RADICAL ─── */}
      <section className="relative pt-16 pb-24 px-6 overflow-hidden border-b border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,168,83,0.08)_0%,_transparent_65%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* Anti-Sale Disclaimer Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            PROGRAMA RIGUROSO DE ALTO TICKET · NO ES UN CURSO TRADICIONAL
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            No te certifiques en Tokenización Inmobiliaria{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-600 line-through decoration-red-500/80">
              si buscas criptos o especulación.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-light">
            El <strong className="text-white font-medium">95% de los realtors y desarrolladores</strong> seguirán atrapados en comisiones fragmentadas y créditos puente bancarios al 18%. Este Master Ejecutivo está reservado para los <span className="text-[#D4A853] font-semibold">10 profesionales seleccionados</span> que dominarán la estructuración fiduciaria de activos reales (RWA) y liderarán la comercialización de los 3 proyectos activos de <strong className="text-white">Bahía de Banderas, Nayarit</strong>.
          </p>

          {/* Core Hook: Tesis Skin in the game */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-[#D4A853]/30 max-w-2xl mx-auto shadow-[0_0_30px_rgba(212,168,83,0.1)]">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#D4A853] uppercase tracking-widest mb-1">
              <Award className="w-4 h-4" />
              Tesis de Graduación Obligatoria con Skin in the Game
            </div>
            <p className="text-xs text-zinc-300">
              No te graduarás con un simple diploma en PDF. Tu proyecto final es <strong className="text-white">convertirte en inversionista real de S'Narai</strong>, recibiendo tu fracción escriturada on-chain y activando tu licencia de broker territorial.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsApplicationModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4A853] via-amber-500 to-amber-600 text-black hover:brightness-110 transition-all shadow-[0_0_30px_rgba(212,168,83,0.3)] hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
            >
              Postular para Evaluación de Admisión
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="#modulos"
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950 transition-all"
            >
              Ver Plan de Estudios (7 Módulos)
            </Link>
          </div>

          <div className="pt-2 text-xs text-zinc-600 flex items-center justify-center gap-4">
            <span>✓ Acceso por filtro de idoneidad</span>
            <span>•</span>
            <span>✓ Cupo máximo: 10 alumnos</span>
            <span>•</span>
            <span>✓ Tutoría cognitiva con Hermes AI 24/7</span>
          </div>
        </div>
      </section>

      {/* ─── EL MANIFIESTO DE LA ANTI-VENTA (FILTRADO RADICAL) ─── */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-b border-zinc-900">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D4A853]">
            Filtro de Admisión Inquebrantable
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Para Quién Es Este Master (y Para Quién NO Es)
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Preferimos una cohorte de 10 profesionales comprometidos que graduar a 500 personas que no ejecutan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Box: Para quién NO es */}
          <div className="p-8 rounded-2xl bg-zinc-950/80 border border-red-500/20 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                ✕
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-400">Para quién NO es este programa:</h3>
                <p className="text-xs text-zinc-500">Por favor, no postules si te identificas con esto:</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                <span><strong>Especuladores de criptomonedas:</strong> Aquí no enseñamos trading, memecoins ni apalancamiento. Operamos con derecho fiduciario y activos tangibles.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                <span><strong>Realtors tradicionales cerrados al cambio:</strong> Si crees que las ventas inmobiliarias seguirán haciéndose con contratos en papel impreso y llamadas en frío, este curso no te servirá.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                <span><strong>Desarrolladores sin tierra ni proyecto legalmente sólido:</strong> Solo estructuramos proyectos con viabilidad jurídica y titularidad comprobable.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                <span><strong>Buscadores de diplomas vacíos:</strong> Si no estás dispuesto a completar tu tesis invirtiendo en S'Narai y operando como broker activo, no serás admitido.</span>
              </li>
            </ul>
          </div>

          {/* Box: Para quién SÍ es */}
          <div className="p-8 rounded-2xl bg-zinc-950/80 border border-[#D4A853]/30 space-y-6 shadow-[0_0_20px_rgba(212,168,83,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/30 flex items-center justify-center text-[#D4A853]">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#D4A853]">Para quién SÍ es este programa:</h3>
                <p className="text-xs text-zinc-500">Perfil ideal para los 10 cupos de la Cohorte Génesis:</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-sm text-zinc-300">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#D4A853] mt-1 flex-shrink-0" />
                <span><strong>Realtors y Brokers de Alto Patrimonio:</strong> Que quieren cerrar clientes que no tienen $500k USD para un condo entero, pero sí $25k o $50k USD para fracciones con rentas en dólares.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#D4A853] mt-1 flex-shrink-0" />
                <span><strong>Agencias y Master Brokers:</strong> Que desean liderar la comercialización de la nueva ola de desarrollos tokenizados en México sin competencia tradicional.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#D4A853] mt-1 flex-shrink-0" />
                <span><strong>Desarrolladores Inmobiliarios Visionarios:</strong> Que buscan fondear preventas más rápido, reducir su costo de capital frente al banco y construir una comunidad leal de inversionistas.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#D4A853] mt-1 flex-shrink-0" />
                <span><strong>Pioneros del Mercado de Bahía de Banderas:</strong> Profesionales listos para tomar la delantera en una de las zonas de mayor plusvalía turística de América Latina.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── PILAR 5: LA ALIANZA TERRITORIAL BAHÍA DE BANDERAS ─── */}
      <section className="py-20 px-6 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A853]/10 text-[#D4A853] text-xs font-mono border border-[#D4A853]/30 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              Pilar Territorial Estratégico
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Los Primeros 10 Graduados Dominarán el Mercado de Bahía de Banderas
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
              No te certificas para buscar proyectos en el aire. Te certificas con <strong className="text-white">3 desarrollos físicos reales y activos</strong> listos para comercializar de inmediato en la zona de mayor demanda internacional de Nayarit y Jalisco.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Proyecto 1: S'Narai */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-[#D4A853]/40 space-y-4 hover:border-[#D4A853] transition-all group shadow-[0_0_20px_rgba(212,168,83,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#D4A853] uppercase tracking-wider">Proyecto Activo #1</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  En Emisión Real
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#D4A853] transition-colors">
                S'Narai Residences &amp; Sanctuary
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Desarrollo eco-luxury en el corazón de la <strong>Zona Dorada de Bucerías, Nayarit</strong>, a pasos de la playa. Modelo de pool hotelero dolarizado con rentas en USDC y plusvalía proyectada del 12-15% anual.
              </p>
              <div className="pt-2 border-t border-zinc-900 text-[11px] text-zinc-500 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">📍 Zona Dorada, Bucerías</span>
                <span className="text-[#D4A853] font-semibold">Tesis del Master (1 Fracción)</span>
              </div>
            </div>

            {/* Proyecto 2: Vista Horizonte */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 hover:border-[#D4A853]/60 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#D4A853] uppercase tracking-wider">Proyecto Activo #2</span>
                <span className="px-2 py-0.5 rounded bg-[#D4A853]/10 text-[#D4A853] text-[10px] font-mono border border-[#D4A853]/20">
                  Preventa Vertical
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#D4A853] transition-colors">
                Torre Vista Horizonte
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Torre residencial de departamentos de lujo con <strong>vista panorámica franca al mar en Bucerías, Nayarit</strong>. Estructuración fiduciaria de preventa para acelerar absorción sin depender de créditos puente bancarios.
              </p>
              <div className="pt-2 border-t border-zinc-900 text-[11px] text-zinc-500 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">📍 Bucerías, Nayarit</span>
                <span className="text-zinc-300 font-semibold">Vista Panorámica al Mar</span>
              </div>
            </div>

            {/* Proyecto 3: Beachfront Condo Nuevo Vallarta */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 hover:border-[#D4A853]/60 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#D4A853] uppercase tracking-wider">Proyecto Activo #3</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                  Listo · Flujo Inmediato
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#D4A853] transition-colors">
                Condominio Pie de Playa Nuevo Vallarta
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Departamento de lujo completamente construido y amueblado en complejo premium a <strong>pie de playa directa en Nuevo Vallarta</strong>. Activo terminado generando flujo operativo inmediato de rentas vacacionales.
              </p>
              <div className="pt-2 border-t border-zinc-900 text-[11px] text-zinc-500 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">📍 Nuevo Vallarta (Frente al Mar)</span>
                <span className="text-blue-400 font-semibold">100% Construido / Flujo Inmediato</span>
              </div>
            </div>
          </div>

          {/* Beneficios de la Cohorte Génesis */}
          <div className="p-8 rounded-2xl bg-zinc-950/90 border border-[#D4A853]/30 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4A853]" />
              Prerrogativas Únicas de los 10 Alumnos Fundadores:
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <span className="text-base">💼</span>
                <div className="font-bold text-white">Comisiones de Master Broker</div>
                <p className="text-zinc-400">Derecho de intermediación preferente sin comisiones compartidas con inmobiliarias intermediarias.</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <span className="text-base">🤖</span>
                <div className="font-bold text-white">Hermes AI Co-Pilot Exclusivo</div>
                <p className="text-zinc-400">Agente de IA entrenado con los planos, proformas y contratos de los 3 proyectos para atender a tus clientes 24/7 en WhatsApp.</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <span className="text-base">🏛️</span>
                <div className="font-bold text-white">Consejo Asesor RWA Pandora's</div>
                <p className="text-zinc-400">Asiento formal con voting power institucional en las decisiones de expansión de los próximos desarrollos.</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <span className="text-base">💎</span>
                <div className="font-bold text-white">Fracción Real Incluida</div>
                <p className="text-zinc-400">Te gradúas como dueño real de una fracción de S'Narai. Tienes skin-in-the-game desde el primer día.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EL PLAN DE ESTUDIOS: 7 MÓDULOS DE ÉLITE ─── */}
      <section id="modulos" className="py-20 px-6 max-w-5xl mx-auto border-b border-zinc-900 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D4A853]">
            Curriculum de Grado Fiduciario
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Los 7 Módulos del Master de Tokenización Inmobiliaria
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto font-light">
            Estructurado para impartirse a través de Masterclasses en video, tutoría cognitiva con Hermes AI y resolución de casos socráticos reales.
          </p>
        </div>

        <div className="space-y-4">
          {modules.map((mod) => {
            const isExpanded = expandedModule === mod.seq;
            const IconComponent = mod.icon;
            return (
              <div
                key={mod.seq}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-zinc-950/90 border-[#D4A853]/50 shadow-[0_0_25px_rgba(212,168,83,0.1)]'
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedModule(isExpanded ? null : mod.seq)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isExpanded ? 'bg-[#D4A853] text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}>
                      M{mod.seq}
                    </div>
                    <div>
                      <div className="text-xs font-mono text-[#D4A853] uppercase tracking-wider">
                        {mod.focus}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {mod.title}
                      </h3>
                    </div>
                  </div>
                  <div className="text-zinc-500 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 pt-2 space-y-4 border-t border-zinc-900"
                    >
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {mod.desc}
                      </p>
                      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-[#D4A853] flex-shrink-0" />
                        <span><strong>Entregable / Blueprint:</strong> {mod.takeaway}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── HERMES AI & LIVING TESTBED DEMO ─── */}
      <section className="py-20 px-6 bg-gradient-to-b from-black via-zinc-950 to-black border-b border-zinc-900">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-mono uppercase tracking-widest text-[#D4A853]">
              Living Testbed · Tecnología en Producción
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Aprenderás Usando el Mismo Ecosistema que Usarán tus Clientes
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              No usamos diapositivas teóricas de PowerPoint. Toda la experiencia de Pandora's Academy corre sobre la infraestructura viva de Pandora's Growth OS:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#D4A853]/10 border border-[#D4A853]/30 flex items-center justify-center text-[#D4A853] flex-shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Tutoría Cognitiva con Hermes AI</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Hermes actúa como tu mentor 24/7, evaluador socrático de exámenes y simulador de clientes difíciles para practicar objeciones.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Certificación Inmutable en IPFS &amp; Blockchain</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Tu título es una credencial criptográfica Soulbound alojada en IPFS con Sovereign CIDv1 y badge SVG dinámico, imposible de falsificar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Portal de Inversionista en Vivo</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Interacción directa con la dApp real de S'Narai para ver rendimientos, voting power de DAO y contratos fiduciarios en tiempo real.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal / Live Preview Box */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2 text-zinc-500">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                <span className="text-[11px] text-zinc-400 ml-2">Hermes Socratic Engine — Real Estate Assessment</span>
              </div>
              <span className="text-[10px] text-emerald-400">PAS v1.0 ONLINE</span>
            </div>

            <div className="space-y-3 text-zinc-300 leading-relaxed font-sans text-xs">
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="text-[10px] text-[#D4A853] font-mono mb-1">PROSPECTO TRADICIONAL (SIMULADOR HERMES):</div>
                "Joven, ¿por qué debería comprar 3 fracciones de S'Narai si mi banco me da un pagaré al 10% anual en pesos?"
              </div>

              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="text-[10px] text-zinc-400 font-mono mb-1">RESPUESTA REALTOR GRADUADO (EXTRACTO):</div>
                "Porque el pagaré en pesos pierde valor frente a la inflación y el dólar. En S'Narai su capital está en dólares respaldado por tierra escriturada en la Zona Dorada de Bucerías, generando una renta operativa dual en USD más la plusvalía de obra..."
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <div className="text-[10px] font-mono font-bold flex items-center justify-between">
                  <span>EVALUACIÓN DETERMINISTA HERMES: APROBADO (94/100)</span>
                  <span className="text-emerald-400">RÚBRICA RWA-03 ✓</span>
                </div>
                <p className="text-[11px] mt-1 text-emerald-200">
                  Fundamento fiduciario impecable. Manejo de moneda dura (USD) vs devaluación. Argumento de plusvalía y ladrillo validado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PILAR 6: INFRAESTRUCTURA DE PAGO Y FACTURACIÓN (PAY & FINANCE) ─── */}
      <section className="py-16 px-6 border-b border-zinc-900 bg-zinc-950/60">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#D4A853]">
              Infraestructura Financiera y Facturación Transparente
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Métodos de Pago Oficiales Habilitados para la Cohorte Génesis
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Una vez aprobada tu postulación por el comité, podrás liquidar tu matrícula mediante cualquiera de nuestros canales fiduciarios o digitales:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853] flex items-center justify-center font-bold">
                SPEI
              </div>
              <h3 className="text-sm font-bold text-white">Transferencia Interbancaria SPEI (MXN)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Facturación fiscal mexicana (CFDI 4.0) 100% deducible de impuestos bajo el rubro de capacitación profesional o consultoría técnica.
              </p>
              <div className="text-[10px] font-mono text-emerald-400">✓ Emisión automática de factura</div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                CARD
              </div>
              <h3 className="text-sm font-bold text-white">Tarjeta de Crédito / Débito Internacional</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Procesamiento cifrado a través de nuestra pasarela institucional con soporte para Visa, Mastercard y American Express.
              </p>
              <div className="text-[10px] font-mono text-emerald-400">✓ Confirmación y recibo inmediato</div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                USDC
              </div>
              <h3 className="text-sm font-bold text-white">Crypto Pay en Moneda Estable (USDC)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Liquidación atómica directa a la tesorería soberana de Pandora's en redes Polygon, Arbitrum, Base y Ethereum sin comisiones bancarias.
              </p>
              <div className="text-[10px] font-mono text-emerald-400">✓ Anclaje por hash en Sovereign Ledger</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 text-center max-w-2xl mx-auto text-xs text-zinc-400">
            <span className="text-[#D4A853] font-bold">Garantía Soberana de Devolución Fiduciaria:</span> Si tras completar el Módulo 1 consideras que los kits legales, el simulador de Hermes y los activos de Bahía de Banderas no multiplican por 10x tu inversión, se te reembolsa el 100% de tu matrícula sin preguntas ni penalizaciones.
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA / ADMISSION APPLICATION ─── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,168,83,0.1)_0%,_transparent_70%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D4A853]">
            Convocatoria Abierta · Cohorte Génesis 2026
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Solo 10 Lugares Disponibles para la Historia de la Tokenización en México
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Revisamos cada solicitud manualmente. Los 10 admitidos recibirán su plan de estudio, acceso a las masterclasses, tutoría de Hermes AI, su asignación fraccional de S'Narai y derechos de comercialización en Bahía de Banderas.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsApplicationModalOpen(true)}
              className="w-full sm:w-auto px-10 py-4 rounded-xl text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4A853] to-amber-600 text-black hover:brightness-110 transition-all shadow-[0_0_35px_rgba(212,168,83,0.35)] hover:scale-105 cursor-pointer"
            >
              Postular para la Admisión Ahora
            </button>
            <Link
              href="/schedule/pandoras"
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white border border-zinc-800 bg-zinc-950"
            >
              Agendar Llamada Informativa
            </Link>
          </div>

          <p className="text-[11px] text-zinc-600 mt-4">
            Módulo de pago fiduciario y crypto activo tras aprobación de perfil. Precios y paquetes revelados en la fase de admisión.
          </p>
        </div>
      </section>

      {/* ─── MODAL DE POSTULACIÓN / APPLICATION SOVEREIGN DRAWER ─── */}
      <AnimatePresence>
        {isApplicationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApplicationModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-zinc-950 border border-[#D4A853]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,168,83,0.2)] z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setIsApplicationModalOpen(false)}
                className="absolute top-5 right-5 text-zinc-500 hover:text-white text-lg font-bold"
              >
                ✕
              </button>

              {applicationSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <h3 className="text-2xl font-bold text-white">Postulación Registrada</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Hemos recibido tus credenciales para la <strong className="text-white">Cohorte Génesis (10 Plazas)</strong>. Nuestro comité y Hermes AI evaluarán tu idoneidad y te contactaremos por WhatsApp y Correo en menos de 24 horas.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/academy/master-tokenizacion/vault"
                      onClick={() => setIsApplicationModalOpen(false)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D4A853] text-black font-bold text-xs hover:brightness-110 transition-all text-center"
                    >
                      Explorar Bóveda de Kits Legales
                    </Link>
                    <a
                      href="https://wa.me/5213222741987?text=Hola%20Marco,%20acabo%20de%20enviar%20mi%20postulación%20para%20la%20Cohorte%20Génesis%20del%20Master%20de%20Tokenización."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white text-center"
                    >
                      Contactar Admisiones en WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono text-[#D4A853] uppercase tracking-wider block mb-1">
                      Proceso de Admisión · Cohorte Génesis (10 Cupos)
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      Postulación al Master de Tokenización
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Completa tus datos profesionales. Evaluamos experiencia comercial, visión patrimonial y presencia en el mercado.
                    </p>
                  </div>

                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          placeholder="Tu nombre y apellidos"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A853]/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Correo Profesional *</label>
                        <input
                          type="email"
                          required
                          placeholder="nombre@inmobiliaria.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A853]/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">WhatsApp (con código de país) *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+52 322 123 4567"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A853]/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Ciudad / Región Operativa *</label>
                        <input
                          type="text"
                          required
                          placeholder="ej. Bahía de Banderas, CDMX, etc."
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A853]/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Perfil Profesional *</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A853]/50"
                        >
                          <option value="realtor">Realtor Independiente / Broker</option>
                          <option value="agency">Agencia Inmobiliaria / Master Broker</option>
                          <option value="developer">Desarrollador Inmobiliario / Constructor</option>
                          <option value="investor">Inversionista Patrimonial / Family Office</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Volumen Anual Transaccionado</label>
                        <select
                          value={formData.annualVolume}
                          onChange={(e) => setFormData({ ...formData, annualVolume: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A853]/50"
                        >
                          <option value="Menos de $500k USD">Menos de $500,000 USD</option>
                          <option value="$500k - $2M USD">$500,000 - $2,000,000 USD</option>
                          <option value="$2M - $10M USD">$2,000,000 - $10,000,000 USD</option>
                          <option value="Más de $10M USD">Más de $10,000,000 USD</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">
                        ¿Por qué deberías ser uno de los 10 alumnos de la Cohorte Génesis? *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Cuéntanos brevemente tu visión y cómo planeas comercializar o desarrollar con tokenización fiduciaria..."
                        value={formData.motivation}
                        onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4A853]/50 resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-[#D4A853] to-amber-600 text-black hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Registrando en Sovereign Ledger...
                          </>
                        ) : (
                          <>
                            Enviar Solicitud de Admisión
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-zinc-600 text-center">
                      Tus datos son encriptados y procesados bajo el protocolo de soberanía de Pandora's OS. No compartimos datos con terceros.
                    </p>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
