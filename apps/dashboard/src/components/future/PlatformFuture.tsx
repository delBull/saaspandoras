"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Bot,
  Brain,
  Rocket,
  Sparkles,
  Network,
  Diamond,
  Infinity
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface FutureFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  timeline: string;
  status: "planned" | "development" | "testing" | "soon";
  color: string;
  benefits: string[];
}

export function PlatformFuture() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const futureFeatures: FutureFeature[] = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Asistente IA Personal",
      description: "Inteligencia artificial que te ayuda a tomar decisiones de inversión",
      timeline: "Q2 2025",
      status: "development",
      color: "from-blue-500 to-cyan-500",
      benefits: [
        "Análisis predictivo personalizado",
        "Recomendaciones en tiempo real",
        "Alertas inteligentes de mercado",
        "Chatbot 24/7 para consultas"
      ]
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Análisis Avanzado",
      description: "Machine learning para predicción de rendimientos y riesgos",
      timeline: "Q3 2025",
      status: "planned",
      color: "from-purple-500 to-pink-500",
      benefits: [
        "Modelos predictivos de rendimiento",
        "Análisis de sentimiento de mercado",
        "Detección automática de oportunidades",
        "Evaluación de riesgos en tiempo real"
      ]
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Multi-Chain Expansion",
      description: "Soporte para múltiples blockchains y cross-chain swaps",
      timeline: "Q4 2025",
      status: "planned",
      color: "from-green-500 to-emerald-500",
      benefits: [
        "Interoperabilidad total",
        "Mejores tasas de gas",
        "Acceso a más liquidez",
        "Nuevos tipos de activos"
      ]
    },
    {
      icon: <Diamond className="w-8 h-8" />,
      title: "NFTs Dinámicos",
      description: "Tokens no fungibles que evolucionan con el rendimiento del activo",
      timeline: "Q1 2026",
      status: "planned",
      color: "from-yellow-500 to-orange-500",
      benefits: [
        "Representación visual única",
        "Evolución basada en métricas",
        "Valorización automática",
        "Mercado secundario exclusivo"
      ]
    },
    {
      icon: <Infinity className="w-8 h-8" />,
      title: "DeFi Avanzado",
      description: "Características DeFi de próxima generación integradas",
      timeline: "Q2 2026",
      status: "planned",
      color: "from-indigo-500 to-purple-500",
      benefits: [
        "Staking de tokens de proyectos",
        "Yield farming optimizado",
        "Préstamos entre usuarios",
        "Seguros descentralizados"
      ]
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Realidad Aumentada",
      description: "Visualiza tus inversiones en el mundo real con AR",
      timeline: "Q3 2026",
      status: "planned",
      color: "from-pink-500 to-rose-500",
      benefits: [
        "Tours virtuales de propiedades",
        "Visualización 3D de proyectos",
        "Experiencias inmersivas",
        "Inspecciones remotas"
      ]
    }
  ];

  const getStatusBadge = (status: FutureFeature["status"]) => {
    const statusConfig = {
      planned: {
        text: "Planificado",
        color: "bg-zinc-800 text-zinc-300"
      },
      development: {
        text: "En Desarrollo",
        color: "bg-blue-500/20 text-blue-400 border border-blue-500/30"
      },
      testing: {
        text: "En Pruebas",
        color: "bg-orange-500/20 text-orange-400 border border-orange-500/30"
      },
      soon: {
        text: "Próximamente",
        color: "bg-green-500/20 text-green-400 border border-green-500/30"
      }
    };

    const config = statusConfig[status];

    return (
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </div>
    );
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="mb-20"
    >
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          El Futuro de la
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {" "}Inversión
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          Características innovadoras que revolucionarán la manera de invertir en activos reales
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {futureFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
          >
            <GlassCard className="h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center text-white`}
                >
                  {feature.icon}
                </motion.div>

                <div className="text-right">
                  <div className="text-sm text-zinc-400 mb-1">{feature.timeline}</div>
                  {getStatusBadge(feature.status)}
                </div>
              </div>

              <motion.h3
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="text-xl font-bold text-white mb-3"
              >
                {feature.title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="text-zinc-400 mb-6"
              >
                {feature.description}
              </motion.p>

              {/* Benefits */}
              <div className="space-y-2">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <motion.div
                    key={benefitIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ delay: 1.4 + index * 0.1 + benefitIndex * 0.05 }}
                    className="flex items-center gap-2 text-sm text-zinc-400"
                  >
                    <div className={`w-1.5 h-1.5 bg-gradient-to-r ${feature.color} rounded-full flex-shrink-0`} />
                    {benefit}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Visión a largo plazo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 1.5 }}
        className="mt-16 text-center"
      >
        <GlassCard className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Visión 2030: Democratización Total
            </h3>
            <p className="text-zinc-400 mb-6">
              Imaginamos un mundo donde cualquier persona, en cualquier lugar, pueda invertir en cualquier activo del mundo real con total transparencia y seguridad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: 999,
                  ease: "linear"
                }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                1B+
              </motion.div>
              <div className="text-sm text-zinc-400">Usuarios globales</div>
            </div>

            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: 999,
                  ease: "linear",
                  delay: 0.5
                }}
                className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                $50T
              </motion.div>
              <div className="text-sm text-zinc-400">Activos tokenizados</div>
            </div>

            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: 999,
                  ease: "linear",
                  delay: 1
                }}
                className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                0%
              </motion.div>
              <div className="text-sm text-zinc-400">Barreras de entrada</div>
            </div>
          </div>

          <p className="text-zinc-500 text-sm mt-6 italic">
            &ldquo;El futuro financiero no es solo digital, es inclusivo, transparente y está al alcance de todos.&rdquo;
          </p>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}