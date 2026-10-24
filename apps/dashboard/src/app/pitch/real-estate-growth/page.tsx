"use client";

import React from "react";
import { PresentationEngine } from "@/components/presentation/PresentationEngine";
import type { Slide } from "@/components/presentation/PresentationEngine";
import { 
  Building2, 
  ArrowRight, 
  Bot, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Calendar,
  Globe2,
  CheckCircle2,
  FileText
} from "lucide-react";


/**
 * PANDORA'S REAL ESTATE GROWTH INFRASTRUCTURE — MASTER PITCH DECK
 * ============================================================================
 * Deck comercial modular para desarrollos inmobiliarios y activos de hospitalidad.
 * Diseñado bajo estética Keynote ultra-premium (Dark Mode, tipografía limpia,
 * micro-gradientes púrpuras y plateados institucionales).
 * 
 * Capa 1: Infraestructura Institucional
 * Capa 2: Módulos Comerciales Reutilizables
 * Capa 3: Piloto y Alcance Modular
 */

const slides: Slide[] = [
  // SLIDE 1: APERTURA
  {
    id: "s1-apertura",
    content: (
      <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 backdrop-blur-md">
          <Building2 className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase tracking-widest text-purple-300 font-semibold">
            Real Estate Growth Infrastructure
          </span>
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-zinc-400">
          PANDORA&apos;S
        </h1>
        <p className="text-2xl md:text-3xl font-light text-zinc-300 max-w-2xl leading-relaxed">
          Infraestructura inteligente para adquisición, gestión y conversión comercial inmobiliaria.
        </p>
        <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-8 text-sm text-zinc-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Desarrollo: <strong className="text-white">Celeste Beach Residences &amp; Spa</strong>
          </span>
          <span>•</span>
          <span>Sesión de Diagnóstico y Expansión Comercial</span>
        </div>
      </div>
    ),
  },


  // SLIDE 2: EL RETO COMERCIAL
  {
    id: "s2-reto-comercial",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-4">
          <span>02</span>
          <span>•</span>
          <span>Diagnóstico de Fricción</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          ¿Dónde se pierde valor en el proceso de venta tradicional?
        </h2>
        <p className="text-xl text-zinc-400 mb-10 max-w-3xl">
          En inventarios de alta gama y modelos fraccionales, el estancamiento rara vez se debe al producto;
          suele originarse en brechas operativas en el embudo:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col gap-3">
            <span className="text-2xl">⏳</span>
            <h3 className="text-lg font-semibold text-white">Tiempos de Respuesta Lentos</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Prospectos internacionales que consultan fuera de horario o en fines de semana y se enfrían antes de ser atendidos por un asesor.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col gap-3">
            <span className="text-2xl">🌍</span>
            <h3 className="text-lg font-semibold text-white">Dispersión y Complejidad</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Reglas de uso, semanas rotativas, calendarios y cuotas explicadas en PDFs estáticos difíciles de asimilar para el comprador.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col gap-3">
            <span className="text-2xl">📉</span>
            <h3 className="text-lg font-semibold text-white">Ceguera del Embudo (Funnel)</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Falta de atribución exacta: no saber qué canal genera prospectos con liquidez real ni en qué objeción se caen las firmas.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // SLIDE 3: LA SOLUCIÓN INTEGRAL
  {
    id: "s3-solucion",
    content: (
      <div className="flex flex-col items-center max-w-5xl mx-auto text-center">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-4">
          <span>03</span>
          <span>•</span>
          <span>Arquitectura Conectada</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Una Operación Comercial Digital Conectada
        </h2>
        <p className="text-xl text-zinc-300 max-w-3xl mb-12">
          Pandora&apos;s Growth OS unifica los canales de captación, la atención inteligente y el inventario en un ecosistema continuo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          <div className="p-6 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/10">
            <Globe2 className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <h4 className="text-base font-bold text-white mb-2">1. Captación</h4>
            <p className="text-xs text-zinc-400">Campañas dirigidas a nichos HNWI, nómadas y redes afines.</p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/10">
            <Bot className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <h4 className="text-base font-bold text-white mb-2">2. Atención 24/7</h4>
            <p className="text-xs text-zinc-400">Hermes califica y resuelve dudas técnicas en inglés y español.</p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/10">
            <Layers className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <h4 className="text-base font-bold text-white mb-2">3. Deal Room</h4>
            <p className="text-xs text-zinc-400">Portal interactivo con planos, cuotas, calendario y contratos.</p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/10">
            <ShieldCheck className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <h4 className="text-base font-bold text-white mb-2">4. Conversión</h4>
            <p className="text-xs text-zinc-400">Traspaso al equipo del desarrollador para formalización notarial.</p>
          </div>
        </div>
      </div>
    ),
  },

  // SLIDE 4: EXPERIENCIA DEL COMPRADOR (DEAL ROOM)
  {
    id: "s4-deal-room",
    content: (
      <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto text-left">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase">
            <span>04</span>
            <span>•</span>
            <span>Portal Whitelabel</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            Un punto de entrada profesional para cada prospecto
          </h2>
          <p className="text-lg text-zinc-300 leading-relaxed">
            Reemplazamos el envío desordenado de folletos con un **Deal Room Institucional** donde el cliente accede a toda la información del desarrollo con transparencia absoluta.
          </p>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Inventario de fracciones (1/8 y 1/16) en tiempo real con precios oficiales.
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Simulador interactivo del sistema rotativo de semanas (pares/impares).
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Calculadora de cuotas de mantenimiento y beneficios ThirdHome.
            </li>
          </ul>
        </div>
        <div className="flex-1 w-full p-8 rounded-3xl bg-zinc-900 border border-white/10 relative overflow-hidden">
          <div className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-4">Vista Previa · Deal Room</div>
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 flex justify-between items-center">
              <span>Unidad 501 (3 Recámaras) · Fracción 1/16</span>
              <span className="text-emerald-400 font-bold">$89,491 USD</span>
            </div>
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 flex justify-between items-center">
              <span>3 Semanas Garantizadas / Año Club</span>
              <span className="text-purple-400">Rotativo Aprobado</span>
            </div>
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 flex justify-between items-center">
              <span>Intercambio Internacional</span>
              <span className="text-zinc-400">ThirdHome Red</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // SLIDE 5: AUTOMATIZACIÓN INTELIGENTE (HERMES + SOFÍA)
  {
    id: "s5-agentes",
    content: (
      <div className="flex flex-col items-center max-w-5xl mx-auto text-center">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-4">
          <span>05</span>
          <span>•</span>
          <span>Capa Cognitiva</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Sofía + Hermes: Atención Ininterrumpida
        </h2>
        <p className="text-xl text-zinc-300 max-w-3xl mb-12">
          Agentes entrenados estrictamente con la documentación autorizada del proyecto, operando como apoyo al equipo de ventas humano.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-left">
          <div className="p-8 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Sofía · Media & Adquisición</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Analiza segmentos de mercado de alto patrimonio, estructura piezas de contenido comercial y coordina la captación de compradores calificados para nutrir el embudo.
            </p>
            <span className="inline-block text-xs text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Adquisición & Lead Nurturing
            </span>
          </div>

          <div className="p-8 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Hermes · Concierge 24/7</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Atiende consultas por WhatsApp y WebChat al instante. Explica con precisión amenidades, calendarios y precios aprobados, transfiriendo al cliente calificado a una llamada con el asesor.
            </p>
            <span className="inline-block text-xs text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Calificación & Agendamiento
            </span>
          </div>
        </div>
      </div>
    ),
  },

  // SLIDE 6: MEDICIÓN Y EMBUTO
  {
    id: "s6-medicion",
    content: (
      <div className="flex flex-col items-center max-w-5xl mx-auto text-center">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-4">
          <span>06</span>
          <span>•</span>
          <span>Visibilidad Total</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Un Embudo Comercial Medible en Tiempo Real
        </h2>
        <p className="text-xl text-zinc-300 max-w-3xl mb-12">
          Dejamos atrás la intuición. Cada interacción queda registrada para optimizar la conversión en cada etapa.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 w-full">
          <div className="p-4 px-6 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-xs text-zinc-500 uppercase">Fase 1</span>
            <div className="text-lg font-bold text-white">Prospectos</div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/30 hidden md:block" />
          <div className="p-4 px-6 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-xs text-zinc-500 uppercase">Fase 2</span>
            <div className="text-lg font-bold text-white">Contactados</div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/30 hidden md:block" />
          <div className="p-4 px-6 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
            <span className="text-xs text-purple-300 uppercase">Fase 3</span>
            <div className="text-lg font-bold text-purple-200">Calificados</div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/30 hidden md:block" />
          <div className="p-4 px-6 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-xs text-zinc-500 uppercase">Fase 4</span>
            <div className="text-lg font-bold text-white">Cita / Visita</div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/30 hidden md:block" />
          <div className="p-4 px-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <span className="text-xs text-emerald-400 uppercase">Fase 5</span>
            <div className="text-lg font-bold text-emerald-300">Cierre Notarial</div>
          </div>
        </div>
      </div>
    ),
  },

  // SLIDE 7: TRAZABILIDAD E INTEGRIDAD DOCUMENTAL
  {
    id: "s7-trazabilidad",
    content: (
      <div className="flex flex-col items-start text-left max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-4">
          <span>07</span>
          <span>•</span>
          <span>Confianza & Cumplimiento</span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-6">
          Integridad Documental y Trazabilidad Verificable
        </h2>
        <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
          Protección de acuerdos mediante repositorios digitales inmutables con registro de auditoría.
        </p>
        <div className="space-y-4 w-full">
          <div className="p-6 rounded-xl bg-zinc-900 border border-white/10 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-base font-bold text-white">Control de Versiones y Bóveda Segura</h4>
              <p className="text-sm text-zinc-400">Planos, reglamentos del condominio y anexos con sellado de tiempo criptográfico (SHA-256).</p>
            </div>
          </div>
          <div className="p-6 rounded-xl bg-zinc-900 border border-white/10 flex items-start gap-4">
            <FileText className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-base font-bold text-white">Certificados Informativos de Reserva</h4>
              <p className="text-sm text-zinc-400">Comprobantes digitales de reserva con folio único, facilitando el traspaso transparente al Notario Público.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // SLIDE 8: PILOTO COMERCIAL DE 30 DÍAS
  {
    id: "s8-piloto",
    content: (
      <div className="flex flex-col items-center max-w-5xl mx-auto text-center">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-4">
          <span>08</span>
          <span>•</span>
          <span>Implementación Ágil</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Piloto Comercial de 30 Días
        </h2>
        <p className="text-lg text-zinc-300 max-w-3xl mb-10">
          Un periodo acotado para validar hipótesis de mercado, velocidad de respuesta y calidad de prospectos antes de compromisos anuales.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full text-left">
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/10">
            <span className="text-xs text-purple-400 font-bold uppercase">Semana 1</span>
            <h4 className="text-sm font-bold text-white mt-2 mb-2">Diagnóstico</h4>
            <p className="text-xs text-zinc-400">Revisión de embudo actual, reglas de Celeste y configuración de Deal Room.</p>
          </div>
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/10">
            <span className="text-xs text-purple-400 font-bold uppercase">Semana 2</span>
            <h4 className="text-sm font-bold text-white mt-2 mb-2">Lanzamiento</h4>
            <p className="text-xs text-zinc-400">Publicación del portal, activación de Hermes y primeras piezas de contenido.</p>
          </div>
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/10">
            <span className="text-xs text-purple-400 font-bold uppercase">Semana 3</span>
            <h4 className="text-sm font-bold text-white mt-2 mb-2">Operación</h4>
            <p className="text-xs text-zinc-400">Atención 24/7, calificación de prospectos y derivación a citas comerciales.</p>
          </div>
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/10">
            <span className="text-xs text-purple-400 font-bold uppercase">Semana 4</span>
            <h4 className="text-sm font-bold text-white mt-2 mb-2">Auditoría</h4>
            <p className="text-xs text-zinc-400">Informe ejecutivo de métricas, CPL y propuesta de escalamiento.</p>
          </div>
        </div>
      </div>
    ),
  },

  // SLIDE 9: MODELO ECONÓMICO
  {
    id: "s9-economico",
    content: (
      <div className="flex flex-col items-center max-w-5xl mx-auto text-center">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-4">
          <span>09</span>
          <span>•</span>
          <span>Estructura de Servicio</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Propuesta Económica Modular
        </h2>
        <p className="text-lg text-zinc-300 max-w-3xl mb-10">
          Diseñada para adecuarse exactamente al nivel de involucramiento que el desarrollo requiera:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-left">
          <div className="p-8 rounded-2xl bg-zinc-900/70 border border-purple-500/30 relative">
            <div className="absolute top-4 right-4 text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-semibold">
              Recomendado
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Modelo A: Licencia & Setup</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Infraestructura tecnológica para potenciar el trabajo del equipo de ventas actual de Celeste.
            </p>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li>✓ Cuota única de Setup e integración de Deal Room.</li>
              <li>✓ Licencia mensual de Growth OS + Hermes AI Concierge.</li>
              <li>✓ Soporte técnico continuo y mantenimiento de base de datos.</li>
            </ul>
          </div>

          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-2">Modelo B: Tecnología + Media</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Incluye la infraestructura tecnológica más la producción activa de campañas y nutrición con Sofía.
            </p>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li>✓ Todo lo incluido en el Modelo A.</li>
              <li>✓ Generación de contenidos, copys y segmentación especializada.</li>
              <li>✓ Monitoreo diario de calidad de prospectos y optimización.</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  // SLIDE 10: CIERRE Y ACCIÓN
  {
    id: "s10-cierre",
    content: (
      <div className="flex flex-col items-center max-w-4xl mx-auto text-center space-y-8">
        <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
          Del inventario disponible a una operación comercial escalable.
        </h2>
        <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
          Definamos los parámetros del piloto de 30 días y los primeros indicadores clave para acelerar la absorción de Celeste Beach Residences.
        </p>
        <div className="pt-6">
          <span className="text-sm text-zinc-500 font-mono">
            Pandora&apos;s Growth OS · Infraestructura Institucional
          </span>
        </div>
      </div>
    ),
  },
];

export default function RealEstatePitchPage() {
  return <PresentationEngine slides={slides} />;
}
