"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Shield,
  ArrowRight,
  Rocket,
  Crown,
  Heart,
  Building2,
  CheckCircle,
  Phone,
  Mail,
  ExternalLink,
  Play
} from "lucide-react";
import { ModernBackground } from "@/components/ui/modern-background";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { StaggerText } from "@/components/ui/stagger-text";
import { MorphingText } from "@/components/ui/morphing-text";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StartPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const barriers = [
    {
      id: 1,
      title: "La Caja Negra de las Comisiones",
      problem: "¿Sabes realmente cuánto pagas? Las finanzas tradicionales ocultan costos en estructuras complejas.",
      solution: "Transparencia Radical. Usamos blockchain para que cada movimiento de dinero sea visible y auditable por todos, siempre.",
      icon: <Shield className="w-8 h-8" />,
      color: "from-red-500 to-orange-500"
    },
    {
      id: 2,
      title: "El Club Exclusivo de la Inversión",
      problem: "Las mejores oportunidades (edificios premium, startups prometedoras) exigen sumas enormes, dejando fuera a la mayoría.",
      solution: "Acceso Democrático. Convertimos estos grandes activos en 'piezas' digitales (tokens). Ahora puedes ser dueño de una fracción con montos accesibles.",
      icon: <Users className="w-8 h-8" />,
      color: "from-blue-500 to-purple-500"
    },
    {
      id: 3,
      title: "El Mito de la Liquidez",
      problem: "Vender tu parte de un edificio o una empresa puede tomar meses o años. Tu dinero queda atrapado.",
      solution: "Liquidez Real 24/7. Creamos mercados digitales (DEXs) donde puedes gestionar tu inversión con la agilidad del mundo moderno.",
      icon: <TrendingUp className="w-8 h-8" />,
      color: "from-green-500 to-teal-500"
    }
  ];

  const manifestoPoints = [
    "Creemos que poseer una fracción de un rascacielos debe ser tan fácil como comprar una acción.",
    "La propiedad fraccionada no es un lujo, es tu derecho a participar en el crecimiento real.",
    "La transparencia no se negocia. Es la base inmutable de la confianza.",
    "Construimos con nuestra comunidad, no para ella. Su voz define nuestro futuro."
  ];

  const testimonials = [
    {
      name: "María",
      type: "Jubilada Inteligente",
      before: "Fondo tradicional, 2% anual, comisiones confusas.",
      after: "Recibe el 8% anual real de la renta de oficinas premium, directo a su cuenta.",
      icon: <Heart className="w-6 h-6" />
    },
    {
      name: "Carlos",
      type: "Profesional Ambicioso",
      before: "Las grandes inversiones inmobiliarias eran inalcanzables.",
      after: "Es dueño de fracciones de 3 edificios corporativos y diversifica como los grandes.",
      icon: <Crown className="w-6 h-6" />
    }
  ];

  const faqs = [
    {
      question: "¿Es esto seguro? ¿No es 'cripto' muy volátil?",
      answer: "Separamos la tecnología de la especulación. Tu inversión está respaldada por activos reales y tangibles (edificios, empresas), no por la volatilidad de las criptomonedas. Usamos blockchain solo por su seguridad y transparencia."
    },
    {
      question: "¿Qué pasa con mi inversión si Pandora's desaparece?",
      answer: "Tu inversión nunca está en nuestras manos. Cada activo se estructura legalmente para que tu propiedad sea independiente de nosotros. Los contratos inteligentes aseguran que los rendimientos fluyan directamente a ti."
    },
    {
      question: "¿Todo esto es legal en [Tu País/Región]?",
      answer: "Absolutamente. Trabajamos con las principales firmas legales para estructurar cada tokenización cumpliendo (y a menudo superando) la normativa vigente. La transparencia blockchain lo hace más auditable que muchos instrumentos tradicionales."
    }
  ];

  const handleSubscription = () => {
    if (email || phone) {
      setIsSubscribed(true);
      // Aquí iría la lógica para enviar a backend
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative overflow-hidden">
      <ModernBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section - EL DESPERTAR FINANCIERO */}
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
            <span className="text-sm font-medium text-blue-400">La Revolución Financiera</span>
          </motion.div>

          <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <StaggerText
              text="Activos Reales."
              className="block"
              delay={0.5}
              staggerDelay={0.1}
            />
            <StaggerText
              text="Inversión Digital."
              className="block"
              delay={1}
              staggerDelay={0.1}
            />
          </h1>

            <div className="text-2xl md:text-3xl mb-6">
              <TypewriterText
                text="Invierte en Proyectos Inmobiliarios. Startups Disruptivas. Activos Exclusivos. Tu Futuro."
                delay={1.5}
                speed={80}
                className="text-zinc-300"
              />
            </div>

            <MorphingText
              text="Tu portafolio, ahora tangible."
              className="text-xl md:text-2xl text-zinc-400"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto mb-8 leading-relaxed"
          >
            ¿Sigues invirtiendo como en el siglo XX? El mundo cambió. Los Activos del Mundo Real (RWA) – bienes raíces, empresas, arte – ya no son solo para los grandes fondos. Son la evolución del capital, y ahora están a tu alcance.
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
            >
              <span className="flex items-center gap-2">
                ¿Listo para Evolucionar?
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* EL DIAGNÓSTICO - Las 3 Barreras */}
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
              de las Finanzas Tradicionales
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

        {/* EL MANIFIESTO PANDORA */}
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
              Lee nuestro Manifiesto completo y únete a la causa
              <ExternalLink className="inline w-4 h-4 ml-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* EL LABORATORIO PANDORA - Simuladores Interactivos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="Toca la Revolución Financiera"
                gradientFrom="from-green-400"
                gradientTo="to-blue-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              (Sin Riesgo)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Simulador 1: Tokenización */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.4 }}
            >
              <GlassCard className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    &ldquo;Tokeniza tu Mundo&rdquo;
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Elige un activo → Ingresa un valor → Mira cómo se convierte en miles de &apos;piezas&apos; digitales
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex gap-2">
                    <button className="flex-1 p-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                      Casa ($500K)
                    </button>
                    <button className="flex-1 p-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                      Edificio ($2M)
                    </button>
                  </div>

                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-xs text-zinc-400 mb-1">Valor del activo</p>
                    <p className="text-lg font-bold text-green-400">$500,000</p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-zinc-400 mb-1">Se convierte en</p>
                    <p className="text-lg font-bold text-blue-400">500,000 tokens</p>
                    <p className="text-xs text-zinc-500">de $1 cada uno</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 italic">
                  &ldquo;Así de simple es convertir valor real en oportunidades digitales.&rdquo;
                </p>
              </GlassCard>
            </motion.div>

            {/* Simulador 2: Transparencia Blockchain */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.6 }}
            >
              <GlassCard className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    &ldquo;Sigue el Dinero (De Verdad)&rdquo;
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Cada movimiento registrado, público e inalterable. Sin trucos.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <button className="w-full p-3 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Ver Transacción en Blockchain
                  </button>

                  <div className="p-3 bg-zinc-800/50 rounded-lg text-left text-xs">
                    <p className="text-zinc-400 mb-1">Transacción reciente:</p>
                    <p className="text-green-400 font-mono">0x742d35Cc6...98f</p>
                    <p className="text-zinc-500 mt-1">✓ Verificada por 15 nodos</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 italic">
                  &ldquo;Cada movimiento registrado, público e inalterable. Sin trucos.&rdquo;
                </p>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>

        {/* HISTORIAS REALES */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="De Inversor Excluido"
                gradientFrom="from-orange-400"
                gradientTo="to-red-400"
              />
            </h2>
            <p className="text-xl text-zinc-400">
              a Dueño Inteligente
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

        {/* LA CAJA FUERTE ABIERTA */}
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
              No es un Eslogan, Es una Promesa Verificable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Los Activos Reales",
                description: "Accede a la documentación legal, fotos y valuaciones de cada proyecto listado.",
                link: "Enlace a Documentos Ejemplo"
              },
              {
                title: "El Flujo del Dinero",
                description: "Entiende exactamente cómo ganamos y cómo ganas tú. Cero comisiones ocultas.",
                link: "Enlace a Modelo de Comisiones"
              },
              {
                title: "Los Riesgos",
                description: "Hablamos abiertamente de los riesgos de cada inversión. La honestidad es la base de la confianza.",
                link: "Enlace a Política de Riesgos"
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
              Descarga nuestro White Paper y Tokenomics para una inmersión profunda
              <ExternalLink className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* PREGUNTAS INCÓMODAS - FAQ */}
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

        {/* Suscripción para campañas */}
        <motion.div
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
                Mantente al Tanto
              </h3>
              <p className="text-zinc-400">
                Recibe actualizaciones exclusivas sobre nuevos proyectos y oportunidades de inversión
              </p>
            </div>

            {!isSubscribed ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                  <Button
                    onClick={handleSubscription}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white px-6 w-full sm:w-auto"
                  >
                    Suscribir
                  </Button>
                </div>

                <div className="text-center text-zinc-500 text-sm">
                  O recibe notificaciones por SMS
                </div>

                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                  <Button
                    onClick={handleSubscription}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white px-6"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg"
              >
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-medium">¡Gracias por suscribirte!</p>
                <p className="text-zinc-400 text-sm">Te mantendremos informado sobre las mejores oportunidades.</p>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 5 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedGradientText
                text="El Futuro Financiero Ya Llegó."
                gradientFrom="from-lime-400"
                gradientTo="to-green-400"
              />
            </h2>

            <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              Elige construir tu futuro financiero sobre bases sólidas y transparentes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
              <GlassCard className="text-left">
                <h3 className="font-bold text-lg text-red-400 mb-3">Opción A: El Museo Financiero</h3>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>• Retornos mediocres</li>
                  <li>• Comisiones ocultas</li>
                  <li>• Acceso limitado</li>
                </ul>
              </GlassCard>

              <GlassCard className="text-left">
                <h3 className="font-bold text-lg text-green-400 mb-3">Opción B: La Evolución Pandora</h3>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>• Rendimientos de activos reales</li>
                  <li>• Transparencia total y verificable</li>
                  <li>• Acceso global y democrático</li>
                </ul>
              </GlassCard>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-bold text-base md:text-xl px-8 md:px-16 py-4 md:py-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-lime-500/25 w-full sm:w-auto"
            >
              <span className="flex items-center gap-2">
                Unirme a la Evolución Pandora
                <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
