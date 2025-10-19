"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Target, Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface PlatformStats {
  totalValue: number;
  activeProjects: number;
  totalUsers: number;
  successRate: number;
}

export function PlatformProgress() {
  const [stats, setStats] = useState<PlatformStats>({
    totalValue: 0,
    activeProjects: 0,
    totalUsers: 0,
    successRate: 0
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const targetStats: PlatformStats = {
      totalValue: 50000000,
      activeProjects: 50,
      totalUsers: 10000,
      successRate: 95
    };

    setIsAnimating(true);

    const duration = 3000; // 3 segundos
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setStats({
        totalValue: Math.floor(targetStats.totalValue * progress),
        activeProjects: Math.floor(targetStats.activeProjects * progress),
        totalUsers: Math.floor(targetStats.totalUsers * progress),
        successRate: Math.floor(targetStats.successRate * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setIsAnimating(false);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M+`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="text-center p-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(stats.totalValue)}
          </div>
          <div className="text-xs text-zinc-400">Capital Movilizado</div>
          {isAnimating && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-0.5 bg-green-500 mt-1 origin-left"
            />
          )}
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="text-center p-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="text-lg font-bold text-blue-400">
            {stats.activeProjects}+
          </div>
          <div className="text-xs text-zinc-400">Proyectos Activos</div>
          {isAnimating && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-0.5 bg-blue-500 mt-1 origin-left"
            />
          )}
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="text-center p-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-lg font-bold text-purple-400">
            {stats.totalUsers.toLocaleString()}+
          </div>
          <div className="text-xs text-zinc-400">Usuarios Registrados</div>
          {isAnimating && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-0.5 bg-purple-500 mt-1 origin-left"
            />
          )}
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="text-center p-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="text-lg font-bold text-orange-400">
            {stats.successRate}%
          </div>
          <div className="text-xs text-zinc-400">Tasa de Éxito</div>
          {isAnimating && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-0.5 bg-orange-500 mt-1 origin-left"
            />
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}