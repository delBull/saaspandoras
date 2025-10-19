"use client";

import { motion } from "framer-motion";
import { cn } from "@saasfly/ui";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowEffect?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className = "",
  hoverEffect = true,
  glowEffect = false,
  delay = 0
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={hoverEffect ? {
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      } : undefined}
      className={cn(
        "relative p-6 bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-xl",
        "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        glowEffect && "shadow-lg shadow-blue-500/10",
        className
      )}
    >
      {/* Efecto de brillo interno */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Bordes animados */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: "linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent)",
          backgroundSize: "200% 200%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </motion.div>
  );
}