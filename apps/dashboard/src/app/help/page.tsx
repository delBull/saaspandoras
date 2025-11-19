"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Rocket,
  Users,
  Shield,
  ArrowRight,
  Phone,
  Mail,
  Crown,
  CheckCircle,
  Calendar,
  FileText,
  HelpCircle,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

import { ModernBackground } from "@/components/ui/modern-background";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { StaggerText } from "@/components/ui/stagger-text";
import { cn } from "@/lib/utils";
import { useGoogleAnalytics, trackEvent, trackPageView } from "@/lib/analytics";

// Support configuration
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_CONTACT || "521XXXXXXXXXXX";
const WHATSAPP_PRE_MESSAGE = encodeURIComponent(
  "Hola, necesito ayuda con Pandora's. Quiero hablar con alguien de soporte."
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_PRE_MESSAGE}`;
const EMAIL_LINK = `mailto:support@pandoras.finance?subject=${encodeURIComponent(
  "Necesito ayuda con Pandora's"
)}&body=${encodeURIComponent(
  "Hola,\n\nNecesito ayuda con: \n\n[Describe tu problema aquí]\n\nGracias.\n"
)}`;

function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-12"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 mb-6 mx-auto">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Centro de Ayuda y Soporte</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          <StaggerText text="¿Necesitas Ayuda?" className="block" delay={0.4} />
          <span className="block text-2xl md:text-3xl text-zinc-300 mt-3">
            Te ayudamos con cualquier duda sobre protocolos y utilidades Web3.
          </span>
        </h1>

        <div className="max-w-3xl mx-auto mt-4">
          <TypewriterText
            text="De contratos inteligentes a estrategias de comunidad. Estamos aquí para guiarte."
            delay={1}
            speed={50}
            className="text-lg text-zinc-300"
          />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={WHATSAPP_LINK}
            onClick={() => trackEvent('help_cta', 'click', 'whatsapp')}
            className="w-full sm:w-auto"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-gradient-to-r from-blue-400 to-cyan-400">
              <span className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5" />
                Hablar con un Estratega
              </span>
            </Button>
          </a>

          <a
            href={EMAIL_LINK}
            onClick={() => trackEvent('help_cta', 'click', 'email')}
            className="w-full sm:w-auto"
          >
            <Button size="lg" variant="ghost" className="border border-zinc-700">
              <span className="flex items-center gap-3">
                <Mail className="w-5 h-5" />
                Enviar email
              </span>
            </Button>
          </a>

          <Link href="/start" onClick={() => trackEvent('help_cta', 'click', 'start')} className="w-full sm:w-auto">
            <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500">
              <span className="flex items-center gap-3">
                <Rocket className="w-5 h-5" />
                Comenzar Mi Protocolo
              </span>
            </Button>
          </Link>
        </div>

        <p className="text-zinc-400 mt-6 text-sm">
          Preguntas frecuentes, soporte técnico y asesoría especializada.
        </p>
      </div>
    </motion.section>
  );
}

function QuickHelp() {
  const quickHelps = [
    {
      category: "Protocolos",
      icon: Shield,
      questions: [
        "Cómo crear mi primer protocolo de utilidad",
        "Dónde auditar contratos inteligentes",
        "Comparación entre Polygon y Ethereum",
        "Principios básicos de tokenomics",
      ]
    },
    {
      category: "Comunidad",
      icon: Users,
      questions: [
        "Estrategias para activar comunidad",
        "Cómo diseñar sistemas Work-to-Earn",
        "Herramientas de engagement",
        "Gestión de comunidades tokenizadas",
      ]
    },
    {
      category: "Técnico",
      icon: FileText,
      questions: [
        "Guías de No-Code para DeFi",
        "Plantillas de contratos verificadas",
        "Integración con wallets",
        "Seguridad en Web3",
      ]
    },
  ];

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Ayuda Rápida por Categoría</h2>
          <p className="text-zinc-400">Encuentra lo que necesitas en segundos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickHelps.map((help, index) => (
            <motion.div key={help.category} initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.3 + index * 0.1 }}>
              <GlassCard className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <help.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-4">{help.category}</h3>

                <div className="space-y-2">
                  {help.questions.map((question, qIndex) => (
                    <button
                      key={qIndex}
                      className="w-full text-left p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-sm text-zinc-300 hover:text-white"
                      onClick={() => trackEvent('help_quick', 'click', question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function FAQ() {
  const faqs = [
    {
      question: "¿Cuál es la diferencia entre NFT membresía y protocolo de utilidad?",
      answer: "Los NFT membresías dan acceso estático. Los protocolos de utilidad premian acciones reales: moderar contenido, crear valor, contribuir a la comunidad. Son sistemas dinámicos que evolucionan con tu proyecto."
    },
    {
      question: "¿Cuánto cuesta lanzar un protocolo?",
      answer: "Depende de la complejidad. Contracts básicos: $500-2,000. Con auditoría externa: $2,000-5,000. Usamos plantillas verificadas para minimizar costos iniciales."
    },
    {
      question: "¿Qué hago si mi comunidad no está lista?",
      answer: "Te ayudamos a diseñar estrategias de crecimiento orgánico: incentivos para early adopters, gamification, y sistemas de referral reward. El 70% del éxito viene de la estrategia de activación."
    },
    {
      question: "¿Puedo integrar mi protocolo con Blockchain actual?",
      answer: "Sí. Diseñamos para interoperabilidad. Los contratos son upgradeables y podemos añadir bridges o integraciones multi-chain según evolución de tu proyecto."
    },
  ];

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Preguntas Frecuentes</h2>
          <p className="text-zinc-400">Respuestas a las más comunes</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + index * 0.1 }}>
              <GlassCard>
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-white">{faq.question}</h3>
                  <p className="text-zinc-400">{faq.answer}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function ContactMethods() {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-12">
      <div className="max-w-4xl mx-auto px-4">
        <GlassCard className="text-center p-8">
          <h2 className="text-2xl font-bold mb-6">¿Aún tienes preguntas?</h2>
          <p className="text-zinc-400 mb-6">
            Nuestro equipo está aquí para guiarte personalmente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Chat Directo</h3>
              <p className="text-sm text-zinc-400 mb-3">Respuestas rápidas y personalizadas</p>
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                <Button size="sm">WhatsApp</Button>
              </a>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Email Detallado</h3>
              <p className="text-sm text-zinc-400 mb-3">Para consultas complejas</p>
              <a href={EMAIL_LINK}>
                <Button size="sm" variant="ghost">support@pandoras.finance</Button>
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-700">
            <p className="text-sm text-zinc-500">
              <strong>Horario de respuesta:</strong> Lun-Vie 9:00-18:00 GMT-6 • Email: 24-48h • WhatsApp: 2-4h en horario laboral
            </p>
          </div>
        </GlassCard>
      </div>
    </motion.section>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>}>
      <HelpPageContent />
    </Suspense>
  );
}

function HelpPageContent() {
  // Google Analytics - Now wrapped in Suspense
  useGoogleAnalytics();
  trackPageView('Help Support Page');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative overflow-hidden">
      <ModernBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16">
        <Hero />
        <QuickHelp />
        <FAQ />
        <ContactMethods />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-12">
          <Link href="/start" onClick={() => trackEvent('help_bottom', 'click', 'start')} className="inline-block">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400">
              <span className="flex items-center gap-2">
                ¿Listo para empezar? Crear mi protocolo
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Floating WhatsApp button */}
      <div className="fixed right-6 bottom-6 z-50">
        <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" onClick={() => trackEvent('help_fab', 'click', 'whatsapp')}>
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center shadow-xl">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
        </a>
      </div>
    </div>
  );
}
