"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, Circle, Clock, Target, Rocket, Users, Globe } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface RoadmapItem {
  quarter: string;
  year: number;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
  icon: React.ReactNode;
  features: string[];
}

export function Roadmap() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const roadmapItems: RoadmapItem[] = [
    {
      quarter: "Q4",
      year: 2024,
      title: "Lanzamiento Beta",
      description: "Plataforma inicial con funcionalidades básicas de tokenización",
      status: "completed",
      icon: <Rocket className="w-6 h-6" />,
      features: [
        "Tokenización básica de propiedades",
        "Wallet integration",
        "Panel administrativo básico",
        "Sistema de KYC inicial"
      ]
    },
    {
      quarter: "Q1",
      year: 2025,
      title: "Expansión Multi-Activos",
      description: "Soporte para múltiples tipos de activos reales",
      status: "completed",
      icon: <Target className="w-6 h-6" />,
      features: [
        "Tokenización de startups",
        "Arte y coleccionables",
        "Propiedad intelectual",
        "Energías renovables"
      ]
    },
    {
      quarter: "Q2",
      year: 2025,
      title: "Gamificación Completa",
      description: "Sistema avanzado de engagement y recompensas",
      status: "current",
      icon: <Users className="w-6 h-6" />,
      features: [
        "Sistema de puntos y niveles",
        "Logros y badges",
        "Leaderboard global",
        "Recompensas exclusivas"
      ]
    },
    {
      quarter: "Q3",
      year: 2025,
      title: "Internacionalización",
      description: "Expansión global y soporte multi-idioma",
      status: "upcoming",
      icon: <Globe className="w-6 h-6" />,
      features: [
        "Soporte multi-idioma completo",
        "Regulaciones internacionales",
        "Partners locales estratégicos",
        "Soporte 24/7 multi-zona"
      ]
    },
    {
      quarter: "Q4",
      year: 2025,
      title: "Web3 Avanzado",
      description: "Características DeFi avanzadas y gobernanza DAO",
      status: "upcoming",
      icon: <Clock className="w-6 h-6" />,
      features: [
        "Gobernanza descentralizada",
        "Staking y yield farming",
        "NFTs dinámicos",
        "Cross-chain compatibility"
      ]
    }
  ];

  const getStatusIcon = (status: RoadmapItem["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "current":
        return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusColor = (status: RoadmapItem["status"]) => {
    switch (status) {
      case "completed":
        return "border-green-500/30 bg-green-500/5";
      case "current":
        return "border-blue-500/30 bg-blue-500/5";
      default:
        return "border-zinc-700/50 bg-zinc-800/30";
    }
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
          Roadmap de
          <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {" "}Evolución
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          Nuestra visión para democratizar la inversión en activos reales a nivel global
        </motion.p>
      </div>

      <div className="max-w-5xl mx-auto">
        {roadmapItems.map((item, index) => (
          <motion.div
            key={`${item.year}-${item.quarter}`}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            transition={{ delay: 0.6 + index * 0.2, duration: 0.6 }}
            className="relative mb-8"
          >
            {/* Línea de conexión */}
            {index < roadmapItems.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-16 bg-zinc-700" />
            )}

            <div className="flex items-start gap-6">
              {/* Timeline dot */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStatusColor(item.status)}`}>
                {getStatusIcon(item.status)}
              </div>

              {/* Content */}
              <GlassCard className={`flex-1 ${getStatusColor(item.status)}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400">
                      {item.quarter} {item.year}
                    </div>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  </div>
                  {item.status === "current" && (
                    <div className="ml-auto px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                      <span className="text-blue-400 text-sm font-medium">En Desarrollo</span>
                    </div>
                  )}
                </div>

                <p className="text-zinc-300 mb-4">{item.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {item.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                      transition={{ delay: 0.8 + index * 0.2 + featureIndex * 0.1 }}
                      className="flex items-center gap-2 text-sm text-zinc-400"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Próximos hitos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 1.5 }}
        className="text-center mt-12"
      >
        <GlassCard className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-3">¿Quieres ser parte del futuro?</h3>
          <p className="text-zinc-400 mb-4">
            Únete a nuestra comunidad y sé de los primeros en conocer los próximos lanzamientos y características exclusivas.
          </p>
          <div className="flex justify-center gap-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              Características exclusivas
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Acceso temprano
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              Eventos globales
            </span>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}