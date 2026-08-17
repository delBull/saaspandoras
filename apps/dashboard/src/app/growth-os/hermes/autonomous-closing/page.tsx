'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Cpu,
  ShieldCheck, 
  Zap, 
  Workflow, 
  CheckCircle,
  CreditCard,
  Building2,
  Lock,
  ChevronLeft,
  Banknote
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AutonomousClosingPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-purple-500 selection:text-black font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/growth-os/hermes" className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-light tracking-tight text-white">HERMES</span>
              <span className="text-xs text-purple-400 font-mono ml-2 hidden sm:inline">Autonomous Closing</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="https://calendly.com/pandoras-finance/strategy"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all"
            >
              Agendar Sesión Técnica
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 max-w-5xl mx-auto text-center">
        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono inline-flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5" />
          <span>Capability Registry: Autonomous Transaction Engine</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white leading-tight mb-8">
          Arquitectura de <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 bg-clip-text text-transparent font-normal">Cierre Autónomo</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 font-light max-w-3xl mx-auto mb-10 leading-relaxed">
          Hermes no es solo un agente conversacional. Es un motor de transacciones capaz de perfilar, calificar y cerrar pagos institucionales 24/7 sin intervención humana.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mb-16">
          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6 shadow-xl">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 inline-block mb-4">
              <Workflow className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Intent Mapping</h3>
            <p className="text-sm text-zinc-400 font-light">
              Hermes analiza cada mensaje para detectar intención de compra y transita al lead hacia el flujo de pago sin fricción.
            </p>
          </div>
          
          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6 shadow-xl">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 inline-block mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Verificación Legal</h3>
            <p className="text-sm text-zinc-400 font-light">
              Presentación de contratos, terms & conditions y manejo de objeciones respaldado por tu Evidence-Backed Claims Engine.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6 shadow-xl">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 inline-block mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Checkout Inteligente</h3>
            <p className="text-sm text-zinc-400 font-light">
              Generación de ligas de pago seguras (SPEI y Web3) en tiempo real directamente en la conversación.
            </p>
          </div>
        </div>
      </section>

      {/* TECHNICAL WORKFLOW SECTION */}
      <section className="py-24 px-6 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">El Workflow de Transacción</h2>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light">
              Así es como Hermes ejecuta un cierre automatizado completo a través de sus capacidades modulares:
            </p>
          </div>

          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6 flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">1</div>
              <div>
                <h4 className="text-base font-medium text-white mb-1">Detección de Señal de Compra</h4>
                <p className="text-sm text-zinc-400 font-light">
                  Mediante NLP avanzado, Hermes reconoce frases como "quiero invertir", "cómo pago" o "¿dónde firmo?". Interrumpe el playbook educativo y lanza la capacidad de <code>CheckoutInitiator</code>.
                </p>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6 flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">2</div>
              <div>
                <h4 className="text-base font-medium text-white mb-1">KYC y Filtros de Elegibilidad</h4>
                <p className="text-sm text-zinc-400 font-light">
                  Dependiendo de las políticas de tu Tenant, Hermes solicitará los datos necesarios (email, teléfono, wallet) para asegurar que el prospecto cumple con el perfil requerido antes de procesar el pago.
                </p>
              </div>
            </div>

            <div className="border border-purple-500/30 rounded-2xl bg-purple-500/5 p-6 flex items-start gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 blur-[50px]"></div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 border border-purple-400 flex items-center justify-center text-sm font-bold text-white">3</div>
              <div>
                <h4 className="text-base font-medium text-white mb-1">Generación de Cesta de Pago y Link</h4>
                <p className="text-sm text-zinc-300 font-light">
                  Hermes se comunica con la API de facturación y pagos (Crypto/Fiat) para generar un enlace de Checkout único con vigencia limitada, y se lo entrega al usuario en el chat.
                </p>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6 flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">4</div>
              <div>
                <h4 className="text-base font-medium text-white mb-1">Confirmación y Onboarding Autónomo</h4>
                <p className="text-sm text-zinc-400 font-light">
                  Una vez detectado el pago exitoso vía Webhook, Hermes agradece la transacción, emite comprobantes digitales y guía al usuario hacia su portal privado o entrega el servicio acordado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 px-6 border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-[#070709] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Monetiza tu audiencia. <br className="hidden md:block"/> De principio a fin.
          </h2>
          <p className="text-base text-zinc-400 font-light mb-10">
            Agenda una llamada técnica con el equipo de Pandoras para descubrir cómo integrar el motor transaccional de Hermes en tus procesos operativos actuales.
          </p>
          <a
            href="https://calendly.com/pandoras-finance/strategy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white hover:bg-zinc-200 text-black font-bold text-base px-10 py-6 rounded-2xl transition-all"
          >
            Agendar Arquitectura
          </a>
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
        </div>
      </footer>

    </div>
  );
}
