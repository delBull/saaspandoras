"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
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

  // Función manejadora para WhatsApp directo
  const handleWhatsAppDirect = () => {
    window.open(`https://wa.me/5213221374392?text=${encodeURIComponent("Hola, soy creador interesado en lanzar protocolos de utilidad")}`, '_blank');
    setIsSubscribed(true);
    trackNewsletterSubscription('landing-start', 'phone');
    trackEvent('whatsapp_eight_questions_start', 'direct', 'Landing Start', 1);
  };

  // Función manejadora para Email con modal
  const handleEmailSelection = () => {
    setSelectedMethod('email');
  };

  // Google Analytics tracking
  useGoogleAnalytics();
  trackPageView('Landing Start Page');

  // --- TRANSFORMACIÓN #1: DE "BARRERAS DE INVERSIÓN" A "BARRERAS DEL CREADOR" ---
  const barriers = [
    {
      id: 1,
      title: "La Prisión de la Plataforma (Web2)",
      problem: "¿Tu comunidad vive en Patreon, Discord o Facebook? Ellos ponen las reglas, se llevan el 30% y te niegan la soberanía sobre tu audiencia.",
      solution: "Declaración de Soberanía. Lanza tus propios protocolos. Define tus reglas, sin intermediarios y sin comisiones abusivas sobre tus ingresos.",
      icon: <Users className="w-8 h-8" />,
      color: "from-red-500 to-orange-500"
    },
    {
      id: 2,
      title: "El Engaño de la Apatía Comunitaria",
      problem: "Tu comunidad es pasiva. Los 'Likes' y 'Follows' no construyen valor. El *engagement* superficial es insostenible y no paga el desarrollo.",
      solution: "Protocolos de Incentivos Verificables. Activa a tus usuarios. Recompénsalos por aportar valor real y medible: validar, moderar, crear o promocionar.",
      icon: <Puzzle className="w-8 h-8" />,
      color: "from-blue-500 to-purple-500"
    },
    {
      id: 3,
      title: "La Parálisis Técnica y Regulatoria",
      problem: "Lanzar un token es un riesgo legal, toma meses en desarrollo y requiere cientos de miles en auditorías. Es la vía rápida al fracaso.",
      solution: "Plataforma No-Code y Blindaje Legal. Lanza tu protocolo de utilidad en minutos desde plantillas pre-auditadas y enfocadas 100% en la *utilidad*, no en la inversión.",
      icon: <Shield className="w-8 h-8" />,
      color: "from-green-500 to-teal-500"
    }
  ];

  // --- TRANSFORMACIÓN #2: MANIFIESTO ENFOCADO EN COMUNIDAD Y UTILIDAD ---
  const manifestoPoints = [
    "La participación real debe ser recompensada con valor verificable, no solo con un 'gracias'.",
    "La propiedad digital no es especulación. Es el derecho inalienable a la participación y la gobernanza.",
    "La transparencia del código es la base inmutable de la confianza. No se negocia.",
    "Construimos *con* nuestra comunidad, no *para* ella. Su voto define la evolución del protocolo."
  ];

  // --- TRANSFORMACIÓN #3: TESTIMONIALES DE "INVERSORES" A "CREADORES" ---
  const testimonials = [
    {
      name: "Laura",
      type: "Artista Digital y Creadora",
      before: "Vendía 'prints' en Patreon. 10% de comisión y cero control. Mi comunidad no tenía incentivo para crecer.",
      after: "Lanzó un NFT de membresía. Ahora su comunidad vota sobre su próxima obra y es recompensada por la lealtad que inyecta valor real a su marca.",
      icon: <Palette className="w-6 h-6" />
    },
    {
      name: "DevCore",
      type: "Proyecto Open-Source",
      before: "Dependían de donaciones esporádicas. Tenían una crisis de pocos contribuidores activos y nula tracción.",
      after: "Implementaron un protocolo 'Work-to-Earn' para recompensar a los devs por cada 'bug' resuelto y validado, acelerando el desarrollo x10.",
      icon: <Code className="w-6 h-6" />
    }
  ];

  // --- TRANSFORMACIÓN #4: FAQS DE "RIESGO DE INVERSIÓN" A "RIESGO DE SOFTWARE" ---
  const faqs = [
    {
      question: "¿Necesito saber programar? ¿Esto es muy técnico?",
      answer: "No. Pandora es una plataforma 'No-Code'. Si sabes usar Shopify o Webflow, sabes usar Pandora. Elige una plantilla de protocolo (lealtad, work-to-earn), configura tus reglas y lanza tu utilidad en minutos."
    },
    {
      question: "¿Qué pasa si mi proyecto es visto como un 'security' (valor/inversión pasiva)?",
      answer: "Esta es la pregunta clave. Nuestra plataforma está diseñada *exclusivamente* para crear utilidad (acceso, trabajo, lealtad). Te guiamos con un *checklist* legal de cumplimiento para asegurar que tu modelo se centre en la participación activa, no en la inversión pasiva."
    },
    {
      question: "¿Qué pasa si Pandora desaparece? ¿Pierdo mi protocolo?",
      answer: "No. Tus smart contracts son 100% tuyos. Una vez desplegados en la blockchain (ej. Polygon, Ethereum), son soberanos y seguirán funcionando para siempre, con o sin nosotros. Esa es la promesa inmutable de la descentralización."
    }
  ];

  const handleSubscription = async () => {
    if (!email && !phone) return;

    try {
      const response = await fetch('/api/email/creator-welcome', {
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
        {/* --- HERO SECTION --- */}
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
            <span className="text-sm font-medium text-blue-400">La Revolución del Creador Soberano</span>
          </motion.div>

          <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <StaggerText
              text="Construye Valor."
              className="block"
              delay={0.5}
              staggerDelay={0.1}
            />
            <StaggerText
              text="Blindaje Protocolario."
              className="block"
              delay={1}
              staggerDelay={0.1}
            />
          </h1>

            <div className="text-2xl md:text-3xl mb-6">
              <TypewriterText
                text="Lanza Membresías NFT. Protocolos Work-to-Earn. Programas de Lealtad. ¡En Minutos!."
                delay={1.5}
                speed={80}
                className="text-zinc-300"
              />
            </div>

            <MorphingText
              text="Tu comunidad, activada para generar ingresos reales."
              className="text-xl md:text-2xl text-zinc-400"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto mb-8 leading-relaxed"
          >
            ¿Por qué sigues construyendo en Web2, pagando 30% en comisiones y cediendo el control de tu audiencia? El futuro son los protocolos de utilidad: incentivos reales, valor verificable y soberanía total sobre tu negocio digital.
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
                [ Construye tu Protocolo Ahora ]
                <ArrowRight className="w-4 h-4 md:w-5" />
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
                text="Las 3 Cárceles de Web2"
                gradientFrom="from-red-400"
                gradientTo="to-orange-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              El Por Qué Tus Ingresos Son Frágiles
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
                text="Esto Es Más Que Software."
                gradientFrom="from-purple-400"
                gradientTo="to-pink-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              Son Principios Inquebrantables.
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

        {/* --- LABORATORIO DE "UTILIDAD" (NO RWA) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="La Utilidad En Tus Manos"
                gradientFrom="from-green-400"
                gradientTo="to-blue-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              (Lanza Protocolos en 5 Clics.)
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
                    &ldquo;Propietario de Membresías NFT&rdquo;
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Elige un beneficio → Sube una imagen → Lanza tu llave de acceso digital y soberana
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-xs text-zinc-400 mb-1">Beneficio Clave</p>
                    <p className="text-lg font-bold text-green-400">Acceso Validado a Servicios Premium</p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-zinc-400 mb-1">Se convierte en</p>
                    <p className="text-lg font-bold text-blue-400">1,000 Licencias NFT</p>
                    <p className="text-xs text-zinc-500">Activables por tu comunidad al instante.</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 italic">
                  &ldquo;De un simple pago a una propiedad digital con valor futuro.&rdquo;
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
                    &ldquo;Monetiza el Trabajo (Work-to-Earn)&rdquo;
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Define la tarea que necesitas → Asigna la recompensa → Observa a tu comunidad construir por ti.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <button className="w-full p-3 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Simular Flujo de Aprobación DAO
                  </button>

                  <div className="p-3 bg-zinc-800/50 rounded-lg text-left text-xs">
                    <p className="text-zinc-400 mb-1">Flujo del Protocolo:</p>
                    <p className="text-white">1. Usuario completa la Tarea: &apos;Moderación de Contenido&apos;</p>
                    <p className="text-white">2. Protocolo Telar verifica la Tarea</p>
                    <p className="text-green-400 font-mono">3. Recompensa Liberada: 10 $PHI_TOKEN</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 italic">
                  &ldquo;Recompensa el *trabajo* que te ahorra tiempo, no la especulación pasiva.&rdquo;
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
                text="De Creador Estancado"
                gradientFrom="from-orange-400"
                gradientTo="to-red-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              a Creador Multiplicador de Valor
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

        {/* --- TRANSPARENCIA (Caja de Herramientas) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="Transparencia Auditada"
                gradientFrom="from-cyan-400"
                gradientTo="to-blue-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              No es un Eslogan. Es Código Verificable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Contratos Pre-Auditados",
                description: "Nuestras plantillas de 'Work-to-Earn' y 'Membresía' han sido validadas por firmas líderes. Lanza con la máxima seguridad desde el día uno.",
                link: "Ver Auditorías"
              },
              {
                title: "Precios Claros y Únicos",
                description: "Entiende exactamente el modelo SaaS de la plataforma. Cero comisiones ocultas sobre tus transacciones o comunidad.",
                link: "Ver Modelo de Precios"
              },
              {
                title: "Blindaje Regulatorio",
                description: "Te proporcionamos guías de cumplimiento para asegurar que tu protocolo se mantenga 100% en el lado de la 'utilidad' y evite riesgos legales.",
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
                  {/*
                  <Link href="#" className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                    [{item.link}]
                  </Link>
                  */}
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
              href="/whitepaper"
              target="_blank"
              rel="noopener noreferrer"
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
                text="Preguntas Incómodas, Respuestas Inmutables"
                gradientFrom="from-yellow-400"
                gradientTo="to-orange-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              Hablemos Claro Sobre Riesgo y Desarrollo
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

        {/* --- SUSCRIPCIÓN (LENGUAJE) --- */}
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
                Acceso Prioritario a Tu Arquitectura de Utilidad
              </h3>
              <p className="text-zinc-400">
                Antes de activar tus herramientas No-Code, necesitamos confirmar tu caso de uso y entregarte la guía técnica adecuada para tu Protocolo
              </p>
            </div>

            {!isSubscribed ? (
              <div className="space-y-4">
                {/* Selector de Método de Contacto */}
                {!selectedMethod ? (
                  <div className="space-y-4">
                    <p className="text-zinc-400 text-center mb-6">
                      Selecciona cómo quieres continuar:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Opción Email */}
                      <button
                        onClick={handleEmailSelection}
                        className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg hover:border-blue-400/40 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                            <Mail className="w-5 h-5 text-blue-400" />
                          </div>
                          <h4 className="font-semibold text-blue-400">Vía Email</h4>
                        </div>
                        <p className="text-zinc-400 text-sm mb-3">
                          Recibe tu Dossier Técnico de Protocolo (Acceso Prioritario)
                        </p>
                        <div className="text-xs text-zinc-500">
                          ✅ Enlace Directo • ✅ Guía
                        </div>
                      </button>

                      {/* Opción WhatsApp - Activado con flujo 8 preguntas */}
                      <button
                        onClick={handleWhatsAppDirect}
                        className="p-6 bg-gradient-to-r from-green-500/10 to-purple-500/10 border border-green-500/20 rounded-lg hover:border-green-400/40 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-400" />
                          </div>
                          <h4 className="font-semibold text-green-400">Vía WhatsApp</h4>
                        </div>
                        <p className="text-zinc-400 text-sm mb-3">
                          Conversación personalizada para evaluar tu caso de uso con nuestro cuestionario de 8 preguntas.
                        </p>
                        <div className="text-xs text-zinc-500">
                          ✅ Sesión 1:1 • ✅ 8 Preguntas Guiding
                        </div>
                        {/* Overlay de coming soon */}
                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Próximamente
                          </span>
                        </div>
                      </div>
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
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <input
                            type="email"
                            placeholder="Email de contacto (obligatorio)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <Button
                          size="lg"
                          onClick={handleSubscription}
                          disabled={!email}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25"
                        >
                          Recibir Acceso Prioritario por Email
                        </Button>
                      </div>
                    ) : (
                      /* Formulario WhatsApp Simplificado */
                      <div className="space-y-4">
                        <div>
                          <input
                            type="tel"
                            placeholder="Tu número de teléfono (opcional)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-green-500 focus:border-green-500 transition-colors"
                          />
                        </div>
                        <p className="text-zinc-400 text-xs text-center">
                          Te llevaremos a WhatsApp con tu información preparada.
                        </p>

                        <Button
                          onClick={() => {
                            window.open(`https://wa.me/5213221374392?text=${encodeURIComponent("Hola, soy creador interesado en lanzar protocolos de utilidad. Mi nombre es: " + (name || "Anónimo"))}`, '_blank');
                            setIsSubscribed(true);
                            trackNewsletterSubscription('landing-start', 'phone');
                            trackEvent('whatsapp_eight_questions_start', 'direct', 'Landing Start', 1);
                            alert('¡Excelente! Te llevo a WhatsApp para comenzar tu sesión de 8 preguntas personalizadas.');
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white py-4 text-lg font-bold rounded-lg transition-all duration-300"
                        >
                          Continuar en WhatsApp
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ) : (
              /* Success Message */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-green-500/10 border border-green-500/20 rounded-xl"
              >
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">
                  ¡Registro Exitoso!
                </h3>
                <p className="text-zinc-300">
                  Tu acceso prioritario está confirmado. Revisa tu [Email/WhatsApp] en los próximos minutos para la guía de implementación de tu protocolo.
                </p>
                <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300 transition-colors">
                  Regresar a la página principal
                  <ArrowRight className="inline w-4 h-4 ml-1" />
                </Link>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>


        {/* FOOTER */}
        <div className="text-center text-zinc-600 text-sm mt-20">
          <p>
            © {new Date().getFullYear()} Pandora's Finance. Todos los derechos reservados.
          </p>
          <p>
            Construyendo la infraestructura de utilidad inmutable para creadores soberanos.
          </p>
        </div>

      </div>
    </div>
  );
}

// NOTE: WhatsAppLeadForm and other UI components are assumed to exist based on the import list.
// The provided code assumes Next.js environment with Tailwind and lucide-react.

export default function StartPage() {
  return (
    <Suspense fallback={<div>Cargando experiencia...</div>}>
      <StartPageContent />
    </Suspense>
  );
}
