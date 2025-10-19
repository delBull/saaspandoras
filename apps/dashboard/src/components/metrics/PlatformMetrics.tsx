"use client";

import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, DollarSign, Target, Activity, Globe, Shield } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface MetricData {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  description: string;
  color: string;
  targetValue: number;
}

export function PlatformMetrics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [animatedValues, setAnimatedValues] = useState<Record<number, number>>({});

  const metrics: MetricData[] = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      value: 50000000,
      suffix: "+",
      label: "Capital Movilizado",
      description: "Valor total de activos tokenizados",
      color: "from-green-500 to-emerald-500",
      targetValue: 50000000
    },
    {
      icon: <Target className="w-8 h-8" />,
      value: 50,
      suffix: "+",
      label: "Proyectos Activos",
      description: "Activos generando rendimientos",
      color: "from-blue-500 to-cyan-500",
      targetValue: 50
    },
    {
      icon: <Users className="w-8 h-8" />,
      value: 10000,
      suffix: "+",
      label: "Usuarios Globales",
      description: "Inversores de todo el mundo",
      color: "from-purple-500 to-pink-500",
      targetValue: 10000
    },
    {
      icon: <Activity className="w-8 h-8" />,
      value: 95,
      suffix: "%",
      label: "Tasa de Éxito",
      description: "Proyectos que generan retornos",
      color: "from-orange-500 to-red-500",
      targetValue: 95
    },
    {
      icon: <Globe className="w-8 h-8" />,
      value: 150,
      suffix: "+",
      label: "Países",
      description: "Alcance internacional",
      color: "from-teal-500 to-blue-500",
      targetValue: 150
    },
    {
      icon: <Shield className="w-8 h-8" />,
      value: 99,
      suffix: ".9%",
      label: "Uptime",
      description: "Disponibilidad garantizada",
      color: "from-indigo-500 to-purple-500",
      targetValue: 99.9
    }
  ];

  useEffect(() => {
    if (isInView) {
      metrics.forEach((metric, index) => {
        const duration = 2000; // 2 segundos
        const steps = 60;
        const increment = metric.targetValue / steps;
        let currentValue = 0;

        const timer = setInterval(() => {
          currentValue += increment;
          if (currentValue >= metric.targetValue) {
            currentValue = metric.targetValue;
            clearInterval(timer);
          }

          setAnimatedValues(prev => ({
            ...prev,
            [index]: currentValue
          }));
        }, duration / steps);

        return () => clearInterval(timer);
      });
    }
  }, [isInView, metrics]);

  const formatValue = (value: number, suffix = "") => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M${suffix}`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K${suffix}`;
    }
    return `${value.toLocaleString()}${suffix}`;
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
          Pandora&apos;s en
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {" "}Números
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          El crecimiento y impacto de nuestra plataforma habla por sí solo
        </motion.p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => {
          const animatedValue = animatedValues[index] ?? 0;
          const displayValue = metric.suffix?.includes('%')
            ? animatedValue
            : Math.floor(animatedValue);

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
            >
              <GlassCard className="text-center p-4 h-full hover:scale-105 transition-transform duration-300">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                  className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-r ${metric.color} rounded-full flex items-center justify-center text-white`}
                >
                  {metric.icon}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="text-2xl md:text-3xl font-bold text-white mb-1"
                >
                  {formatValue(displayValue, metric.suffix)}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="font-semibold text-zinc-200 mb-2 text-sm"
                >
                  {metric.label}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  className="text-xs text-zinc-400"
                >
                  {metric.description}
                </motion.div>

                {/* Barra de progreso */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{
                    delay: 1.6 + index * 0.1,
                    duration: 1,
                    type: "spring",
                    stiffness: 100
                  }}
                  className={`h-1 bg-gradient-to-r ${metric.color} rounded-full mt-3 origin-left`}
                />
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Métrica adicional grande */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 2 }}
        className="mt-16 text-center"
      >
        <GlassCard className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                300%
              </motion.div>
              <div className="text-sm text-zinc-400">Crecimiento anual</div>
            </div>

            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.5
                }}
                className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                24/7
              </motion.div>
              <div className="text-sm text-zinc-400">Liquidez global</div>
            </div>

            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1
                }}
                className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                $1+
              </motion.div>
              <div className="text-sm text-zinc-400">Desde $1 dólar</div>
            </div>

            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1.5
                }}
                className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                ∞
              </motion.div>
              <div className="text-sm text-zinc-400">Posibilidades</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}