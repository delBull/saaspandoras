"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Globe, TrendingUp, Users, Shield, Zap, Heart } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface ImpactMetric {
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
  color: string;
  delay: number;
}

export function ImpactMetrics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const metrics: ImpactMetric[] = [
    {
      icon: <Globe className="w-8 h-8" />,
      value: "150+",
      label: "Países Alcanzados",
      description: "Inversores de todo el mundo participan en proyectos locales",
      color: "from-blue-500 to-cyan-500",
      delay: 0.1
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      value: "300%",
      label: "Crecimiento Anual",
      description: "Expansión constante en usuarios y volumen de inversión",
      color: "from-green-500 to-emerald-500",
      delay: 0.2
    },
    {
      icon: <Users className="w-8 h-8" />,
      value: "10,000+",
      label: "Usuarios Activos",
      description: "Comunidad creciente de inversores inteligentes",
      color: "from-purple-500 to-pink-500",
      delay: 0.3
    },
    {
      icon: <Shield className="w-8 h-8" />,
      value: "99.9%",
      label: "Uptime Garantizado",
      description: "Disponibilidad constante para todos los usuarios",
      color: "from-orange-500 to-red-500",
      delay: 0.4
    },
    {
      icon: <Zap className="w-8 h-8" />,
      value: "24/7",
      label: "Liquidez Global",
      description: "Compra y vende en cualquier momento, desde cualquier lugar",
      color: "from-yellow-500 to-orange-500",
      delay: 0.5
    },
    {
      icon: <Heart className="w-8 h-8" />,
      value: "4.9/5",
      label: "Satisfacción",
      description: "Calificación promedio de nuestros usuarios",
      color: "from-pink-500 to-rose-500",
      delay: 0.6
    }
  ];

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
          Impacto
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {" "}Global
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          Nuestra plataforma está transformando la manera en que el mundo invierte en activos reales
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, _index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={isInView ? {
              opacity: 1,
              y: 0,
              scale: 1
            } : {
              opacity: 0,
              y: 20,
              scale: 0.9
            }}
            transition={{
              delay: metric.delay,
              duration: 0.6,
              type: "spring",
              stiffness: 100
            }}
          >
            <GlassCard className="text-center h-full hover:scale-105 transition-transform duration-300">
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{
                  delay: metric.delay + 0.3,
                  type: "spring",
                  stiffness: 200
                }}
                className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${metric.color} rounded-full flex items-center justify-center text-white`}
              >
                {metric.icon}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: metric.delay + 0.5 }}
                className="text-3xl font-bold text-white mb-2"
              >
                {metric.value}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: metric.delay + 0.7 }}
                className="font-bold text-lg text-zinc-200 mb-3"
              >
                {metric.label}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: metric.delay + 0.9 }}
                className="text-sm text-zinc-400"
              >
                {metric.description}
              </motion.div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Línea de progreso global */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ delay: 1, duration: 1.5 }}
        className="mt-16 max-w-4xl mx-auto"
      >
        <div className="bg-zinc-800/50 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.2, duration: 2 }}
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative"
          >
            <motion.div
              animate={{
                x: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </motion.div>
        </div>
        <p className="text-center text-zinc-400 text-sm mt-3">
          Crecimiento continuo hacia la democratización financiera global
        </p>
      </motion.div>
    </motion.div>
  );
}