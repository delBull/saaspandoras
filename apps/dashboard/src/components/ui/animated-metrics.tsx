"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

interface MetricItem {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface AnimatedMetricsProps {
  metrics?: MetricItem[];
  className?: string;
}

export function AnimatedMetrics({
  metrics = [
    {
      value: "< 5%",
      label: "Tasa de Aprobación",
      description: "Solo los mejores proyectos pasan nuestro filtro",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-lime-500 to-emerald-500"
    },
    {
      value: "6-8 semanas",
      label: "Proceso Promedio",
      description: "Tiempo desde aplicación hasta lanzamiento",
      icon: <Activity className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      value: "$50M+",
      label: "Capital Movilizado",
      description: "A través de nuestra plataforma hasta la fecha",
      icon: <DollarSign className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      value: "50+",
      label: "Proyectos Exitosos",
      description: "Lanzados y operando exitosamente",
      icon: <Users className="w-6 h-6" />,
      color: "from-orange-500 to-red-500"
    }
  ],
  className = ""
}: AnimatedMetricsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [_counters, setCounters] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isInView) {
      metrics.forEach((_, index) => {
        const timer = setTimeout(() => {
          setCounters(prev => ({ ...prev, [index]: 1 }));
        }, index * 200);
        return () => clearTimeout(timer);
      });
    }
  }, [isInView, metrics]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8 }}
      className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ delay: index * 0.1, duration: 0.6 }}
          className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm hover:bg-zinc-800/50 transition-colors"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
            className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${metric.color} rounded-full flex items-center justify-center text-white`}
          >
            {metric.icon}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: index * 0.1 + 0.5 }}
            className="text-2xl md:text-3xl font-bold text-lime-400 mb-1"
          >
            {metric.value}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: index * 0.1 + 0.7 }}
            className="font-semibold text-white mb-1"
          >
            {metric.label}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: index * 0.1 + 0.9 }}
            className="text-xs text-zinc-400"
          >
            {metric.description}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}