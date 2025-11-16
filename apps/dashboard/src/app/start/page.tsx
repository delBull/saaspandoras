"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  // --- Iconos ELIMINADOS (Securities) ---
  // TrendingUp, Building2, Heart, Crown, Coins,

  // --- Iconos MANTENIDOS/AÑADIDOS (Utilidad/SaaS) ---
  Users,          // Para Comunidad
  Shield,         // Para Seguridad
  ArrowRight,     // Para CTAs
  Rocket,         // Para Lanzamiento
  ExternalLink,   // Para Enlaces
  Play,           // Para Demos
  CheckCircle,    // Para Checkmarks
  Phone,          // Para Contacto
  Mail,           // Para Contacto
  Puzzle,         // Para Work-to-Earn
  Ticket,         // Para Membresías NFT
  Code,           // Para Contratos
  Palette,        // Para Arte (Utilidad)
} from "lucide-react";
import WhatsAppLeadForm from "@/components/WhatsAppLeadForm";
import { ModernBackground } from "@/components/ui/modern-background";
import { useGoogleAnalytics, trackEvent, trackNewsletterSubscription, trackPageView } from "@/lib/analytics";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { StaggerText } from "@/components/ui/stagger-text";
import { MorphingText } from "@/components/ui/morphing-text";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StartPageContent() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'whatsapp' | null>(null);

  // Google Analytics tracking
  useGoogleAnalytics();
  trackPageView('Landing Start Page');

  // --- TRANSFORMACIÓN #1: DE "BARRERAS DE INVERSIÓN" A "BARRERAS DEL CREADOR" ---
  const barriers = [
    {
      id: 1,
      title: "La Prisión de la Plataforma (Web2)",
      problem: "¿Tu comunidad vive en Patreon, Discord o Facebook? Ellos ponen las reglas, se llevan el 30% y no eres dueño de tu audiencia.",
      solution: "Soberanía del Creador. Lanza tus propios protocolos. Define tus reglas, sin intermediarios y sin comisiones abusivas.",
      icon: <Users className="w-8 h-8" />,
      color: "from-red-500 to-orange-500"
    },
    {
      id: 2,
      title: "El Virus de la Apatía",
      problem: "Tu comunidad es pasiva. Los 'Likes' y 'Follows' no pagan las cuentas y no construyen valor real. El engagement es nulo.",
      solution: "Protocolos de Incentivos. Activa a tus usuarios. Recompénsalos por aportar valor real: validar, moderar, crear o promocionar.",
      icon: <Puzzle className="w-8 h-8" />,
      color: "from-blue-500 to-purple-500"
    },
    {
      id: 3,
      title: "La Barrera Técnica y Legal",
      problem: "Lanzar un token es caro (cientos de miles en auditorías), complejo (meses de desarrollo) y legalmente aterrador.",
      solution: "Plataforma No-Code. Lanza tu protocolo de utilidad en minutos desde plantillas pre-auditadas y legalmente seguras.",
      icon: <Shield className="w-8 h-8" />,
      color: "from-green-500 to-teal-500"
    }
  ];

  // --- TRANSFORMACIÓN #2: MANIFIESTO ENFOCADO EN COMUNIDAD Y UTILIDAD ---
  const manifestoPoints = [
    "Creemos que 'participar' en una comunidad debe ser recompensado, no solo 'consumir' contenido.",
    "La propiedad digital no es especulación, es un derecho de participación y gobernanza.",
    "La transparencia no se negocia. Es la base inmutable de la confianza comunitaria.",
    "Construimos con nuestra comunidad, no para ella. Su voz define nuestro futuro."
  ];

  // --- TRANSFORMACIÓN #3: TESTIMONIALES DE "INVERSORES" A "CREADORES" ---
  const testimonials = [
    {
      name: "Laura",
      type: "Artista Digital y Creadora",
      before: "Vendía 'prints' en Patreon. 10% de comisión y cero control sobre mi comunidad.",
      after: "Lanzó un NFT de membresía. Ahora su comunidad vota sobre su próxima obra y recibe recompensas por su lealtad.",
      icon: <Palette className="w-6 h-6" />
    },
    {
      name: "DevCore",
      type: "Proyecto Open-Source",
      before: "Dependían de donaciones esporádicas. Pocos contribuidores activos.",
      after: "Implementaron un protocolo 'Work-to-Earn' para recompensar a los devs por cada 'bug' resuelto y validado.",
      icon: <Code className="w-6 h-6" />
    }
  ];

  // --- TRANSFORMACIÓN #4: FAQS DE "RIESGO DE INVERSIÓN" A "RIESGO DE SOFTWARE" ---
  const faqs = [
    {
      question: "¿Necesito saber programar? ¿Esto es muy técnico?",
      answer: "No. Pandora es una plataforma 'No-Code'. Si sabes usar Shopify o Webflow, sabes usar Pandora. Elige una plantilla de protocolo (lealtad, work-to-earn), configura tus reglas y lanza."
    },
    {
      question: "¿Qué pasa si mi proyecto es visto como un 'security' (valor)?",
      answer: "Es la pregunta correcta. Nuestra plataforma está diseñada *exclusivamente* para crear 'utilidad' (acceso, trabajo, lealtad). Te guiamos en el 'onboarding' con un checklist legal para asegurar que tu modelo se centre en la participación, no en la inversión pasiva."
    },
    {
      question: "¿Qué pasa si Pandora desaparece? ¿Pierdo mi comunidad?",
      answer: "No. Tus smart contracts son 100% tuyos. Una vez desplegados en la blockchain (ej. Polygon, Ethereum), son soberanos y seguirán funcionando para siempre, con o sin nosotros. Esa es la belleza de la descentralización."
    }
  ];

  const handleSubscription = async () => {
    if (!email && !phone) return;

    try {
      const response = await fetch('/api/newsletter-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: email || phone,
          source: 'landing-start',
          tags: ['web3-creator', 'start-landing'],
          language: 'es',
          metadata: {
            page: 'dashboard/landing/start',
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
          }
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        setName('');
        setEmail('');
        setPhone('');

        // Track successful subscription in Google Analytics
        trackNewsletterSubscription('landing-start', email ? 'email' : 'phone');
        trackEvent('newsletter_subscription', 'conversion', 'Landing Start', 1);
      } else {
        const errorData = await response.json() as { message?: string };
        alert('Error: ' + (errorData.message ?? 'No se pudo procesar la suscripción'));
      }
    } catch (error) {
      console.error('Error al suscribirse:', error);
      alert('Error de conexión. Inténtalo nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative overflow-hidden">
      <ModernBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* --- TRANSFORMACIÓN #5: HERO SECTION --- */}
        {/* De "Inversión" a "Construcción de Comunidades" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6"
          >
            <Rocket className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">La Evolución del Creador</span>
          </motion.div>

          <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <StaggerText
              text="Comunidades Reales."
              className="block"
              delay={0.5}
              staggerDelay={0.1}
            />
            <StaggerText
              text="Protocolos Digitales."
              className="block"
              delay={1}
              staggerDelay={0.1}
            />
          </h1>

            <div className="text-2xl md:text-3xl mb-6">
              <TypewriterText
                text="Lanza Programas de Lealtad. Membresías NFT. Protocolos Work-to-Earn. Tu Comunidad."
                delay={1.5}
                speed={80}
                className="text-zinc-300"
              />
            </div>

            <MorphingText
              text="Tu comunidad, ahora activada."
              className="text-xl md:text-2xl text-zinc-400"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto mb-8 leading-relaxed"
          >
            ¿Sigues construyendo en plataformas Web2 que te cobran 30% y son dueñas de tu audiencia? El mundo cambió. Los protocolos de utilidad te permiten crear incentivos reales, activar a tus usuarios y ser 100% soberano.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center mb-8"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold text-base md:text-lg px-8 md:px-12 py-4 md:py-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 w-full sm:w-auto max-w-xs md:max-w-none"
              onClick={() => document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="flex items-center gap-2">
                [ Empezar a Construir Gratis ]
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* --- EL DIAGNÓSTICO (Barreras del Creador) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="Las 3 Barreras Ocultas"
                gradientFrom="from-red-400"
                gradientTo="to-orange-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              de las Plataformas Web2
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {barriers.map((barrier, index) => (
              <motion.div
                key={barrier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.2 }}
              >
                <GlassCard className="h-full" delay={1 + index * 0.2}>
                  <div className="text-center mb-6">
                    <div className={cn(
                      "inline-flex p-3 rounded-lg bg-gradient-to-r mb-4",
                      barrier.color
                    )}>
                      <div className="text-white">
                        {barrier.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">
                      {barrier.title}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-300 text-sm font-medium mb-2">El Problema:</p>
                      <p className="text-zinc-300 text-sm">{barrier.problem}</p>
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-300 text-sm font-medium mb-2">La Solución Pandora&apos;s:</p>
                      <p className="text-zinc-300 text-sm">{barrier.solution}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* --- EL MANIFIESTO PANDORA (Enfoque Creador) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="No Somos Solo una Plataforma."
                gradientFrom="from-purple-400"
                gradientTo="to-pink-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              Somos un Movimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {manifestoPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 + index * 0.1 }}
              >
                <GlassCard className="text-center" delay={1.6 + index * 0.1}>
                  <p className="text-zinc-300 italic">&ldquo;{point}&rdquo;</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-center mt-8"
          >
            <Link href="#manifesto" className="text-blue-400 hover:text-blue-300 transition-colors">
              Lee nuestro Manifiesto del Creador y únete a la causa
              <ExternalLink className="inline w-4 h-4 ml-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* --- TRANSFORMACIÓN #6: LABORATORIO DE "UTILIDAD" (NO RWA) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="Toca la Revolución Comunitaria"
                gradientFrom="from-green-400"
                gradientTo="to-blue-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              (Sin Riesgo. Sin Código.)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Simulador 1: Membresía NFT */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.4 }}
            >
              <GlassCard className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    &ldquo;Crea tu Membresía&rdquo;
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Elige un beneficio → Sube una imagen → Lanza tu llave de acceso digital
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex gap-2">
                    <button className="flex-1 p-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                      Acceso a Discord
                    </button>
                    <button className="flex-1 p-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                      Airdrop Futuro
                    </button>
                  </div>

                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-xs text-zinc-400 mb-1">Beneficio Clave</p>
                    <p className="text-lg font-bold text-green-400">Acceso a Discord Privado</p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-zinc-400 mb-1">Se convierte en</p>
                    <p className="text-lg font-bold text-blue-400">1,000 Membresías NFT</p>
                    <p className="text-xs text-zinc-500">Listas para tu comunidad</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 italic">
                  &ldquo;Así de simple es crear propiedad digital y utilidad real.&rdquo;
                </p>
              </GlassCard>
            </motion.div>

            {/* Simulador 2: Protocolo Work-to-Earn */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.6 }}
            >
              <GlassCard className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Puzzle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    &ldquo;Activa tu Comunidad (Work-to-Earn)&rdquo;
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Define una tarea → Asigna una recompensa → Observa cómo tu comunidad construye.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <button className="w-full p-3 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Simular Tarea de Validación
                  </button>

                  <div className="p-3 bg-zinc-800/50 rounded-lg text-left text-xs">
                    <p className="text-zinc-400 mb-1">Flujo del Protocolo:</p>
                    <p className="text-white">1. Usuario completa la Tarea: &apos;Validar Reseña&apos;</p>
                    <p className="text-white">2. Protocolo verifica la Tarea</p>
                    <p className="text-green-400 font-mono">3. Recompensa Liberada: 10 $TOKEN_UTILIDAD</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 italic">
                  &ldquo;Recompensa el &apos;trabajo&apos;, no la especulación. Así se construye valor real.&rdquo;
                </p>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>

        {/* --- HISTORIAS DE CREADORES (Transformado) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="De Creador Dependiente"
                gradientFrom="from-orange-400"
                gradientTo="to-red-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              a Creador Soberano
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 + index * 0.2 }}
              >
                <GlassCard className="h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white">
                      {testimonial.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{testimonial.name}</h3>
                      <p className="text-sm text-zinc-400">{testimonial.type}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-300 text-sm font-medium mb-2">Antes:</p>
                      <p className="text-zinc-300 text-sm">{testimonial.before}</p>
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-300 text-sm font-medium mb-2">Ahora con Pandora&apos;s:</p>
                      <p className="text-zinc-300 text-sm">{testimonial.after}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* --- TRANSFORMACIÓN #7: DE "CAJA FUERTE" A "CAJA DE HERRAMIENTAS" --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="Nuestra Transparencia"
                gradientFrom="from-cyan-400"
                gradientTo="to-blue-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              No es un Eslogan, Es una Promesa de Software
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Contratos Auditados",
                description: "Nuestras plantillas de 'Work-to-Earn' y 'Membresía' están auditadas por firmas líderes. Lanza con seguridad.",
                link: "Ver Auditorías"
              },
              {
                title: "Precios Claros (SaaS)",
                description: "Entiende exactamente cuánto pagas por usar nuestra plataforma. Sin comisiones ocultas sobre tu comunidad.",
                link: "Ver Modelo de Precios"
              },
              {
                title: "Guías de Cumplimiento",
                description: "Te guiamos para que tu protocolo se mantenga en el lado de la 'utilidad' y evites riesgos regulatorios.",
                link: "Leer Guías de Utilidad"
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.6 + index * 0.1 }}
              >
                <GlassCard className="text-center h-full">
                  <h3 className="font-bold text-lg text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{item.description}</p>
                  <Link href="#" className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                    [{item.link}]
                  </Link>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
            className="text-center"
          >
            <Link
              href="#whitepaper"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-lg font-medium"
            >
              Lee nuestro Litepaper (Técnico) para una inmersión profunda
              <ExternalLink className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* --- FAQS (Transformado) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.2 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="Preguntas Incómodas"
                gradientFrom="from-yellow-400"
                gradientTo="to-orange-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              Hablemos Claro
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4.4 + index * 0.1 }}
              >
                <GlassCard>
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-white">{faq.question}</h3>
                    <p className="text-zinc-400">{faq.answer}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* --- TRANSFORMACIÓN #8: SUSCRIPCIÓN (LENGUAJE) --- */}
        <motion.div
          id="subscription"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.8 }}
          className="mb-20"
        >
          <GlassCard className="text-center max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                ¡Únete al Movimiento!
              </h3>
              <p className="text-zinc-400">
                Sé el primero en lanzar protocolos de utilidad con herramientas 'No-Code'. Recibe invitación prioritaria al formulario de aplicación.
              </p>
            </div>

            {!isSubscribed ? (
              <div className="space-y-4">
                {/* Selector de Método de Contacto */}
                {!selectedMethod ? (
                  <div className="space-y-4">
                    <p className="text-zinc-400 text-center mb-6">
                      Elige cómo quieres que te contactemos:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Opción Email */}
                      <button
                        onClick={() => setSelectedMethod('email')}
                        className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg hover:border-blue-400/40 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                            <Mail className="w-5 h-5 text-blue-400" />
                          </div>
                          <h4 className="font-semibold text-blue-400">Por Email</h4>
                        </div>
                        <p className="text-zinc-400 text-sm mb-3">
                          Recibe actualizaciones por email sobre protocolos y guías.
                        </p>
                        <div className="text-xs text-zinc-500">
                          ✅ Gratis • ✅ Inmediato • ✅ Detallado
                        </div>
                      </button>

                      {/* Opción WhatsApp */}
                      <button
                        onClick={() => setSelectedMethod('whatsapp')}
                        className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg hover:border-green-400/40 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                            <Phone className="w-5 h-5 text-green-400" />
                          </div>
                          <h4 className="font-semibold text-green-400">Por WhatsApp</h4>
                        </div>
                        <p className="text-zinc-400 text-sm mb-3">
                          Conversación personalizada para diseñar tu protocolo.
                        </p>
                        <div className="text-xs text-zinc-500">
                          ✅ Rápido • ✅ Personal • ✅ Interactivo
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Modal/Formulario Seleccionado */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Header del Modal */}
                    <div className="text-center mb-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4",
                        selectedMethod === 'email'
                          ? "bg-blue-500/10 border border-blue-500/20"
                          : "bg-green-500/10 border border-green-500/20"
                      )}>
                        {selectedMethod === 'email' ? (
                          <>
                            <Mail className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 font-medium">Registro por Email</span>
                          </>
                        ) : (
                          <>
                            <Phone className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-medium">Registro por WhatsApp</span>
                          </>
                        )}
                      </div>

                      <Button
                        onClick={() => setSelectedMethod(null)}
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-zinc-300 mb-4"
                      >
                        ← Cambiar método
                      </Button>
                    </div>

                    {selectedMethod === 'email' ? (
                      /* Formulario Email */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Tu nombre (opcional)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none md:order-1"
                          />
                          <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && email && handleSubscription()}
                            className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none md:order-2"
                          />
                        </div>

                        <Button
                          onClick={handleSubscription}
                          disabled={!email}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          📝 ¡Registrar mi Interés como Creador!
                        </Button>

                        <p className="text-zinc-500 text-xs text-center">
                          Recibirás un email confirmando tu registro.
                        </p>
                      </div>
                    ) : (
                      /* Formulario WhatsApp */
                      <div className="space-y-4">
                        <WhatsAppLeadForm />

                        <p className="text-zinc-500 text-xs text-center">
                          Te llevará a WhatsApp con las instrucciones para aplicar.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg"
              >
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-bold text-lg">🎉 ¡Interés registrado exitosamente!</p>
              <p className="text-zinc-400 text-sm mt-2">Próximamente recibirás acceso prioritario al formulario completo para lanzar tu primer protocolo de utilidad. ¡Prepárate para revolucionar tu comunidad digital!</p>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        {/* --- TRANSFORMACIÓN #9: CTA FINAL (WEB2 VS WEB3) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 5 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="El Futuro del Creador Ya Llegó."
                gradientFrom="from-lime-400"
                gradientTo="to-green-400"
              />
            </h2>

            <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              Elige construir tu comunidad sobre bases soberanas y transparentes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
              <GlassCard className="text-left">
                <h3 className="font-bold text-lg text-red-400 mb-3">Opción A: El Jardín Cerrado (Web2)</h3>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>• Comisiones del 30-50%</li>
                  <li>• Audiencia &apos;alquilada&apos;</li>
                  <li>• Usuarios pasivos (apatía)</li>
                </ul>
              </GlassCard>

              <GlassCard className="text-left">
                <h3 className="font-bold text-lg text-green-400 mb-3">Opción B: La Comunidad Soberana (Pandora&apos;s)</h3>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>• Protocolos de Incentivos (Work-to-Earn)</li>
                  <li>• Transparencia total y propiedad real</li>
                  <li>• Comunidad activada y soberana</li>
                </ul>
              </GlassCard>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-bold text-base md:text-xl px-8 md:px-16 py-4 md:py-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-lime-500/25 w-full sm:w-auto"
              onClick={() => document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="flex items-center gap-2">
                Unirme a la Evolución del Creador
                <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center"><div className="text-white">Cargando...</div></div>}>
      <StartPageContent />
    </Suspense>
  );
}
