"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Crown } from "lucide-react";

interface AnimatedBackgroundProps {
  variant?: "apply" | "form";
  className?: string;
}

export function AnimatedBackground({ className = "" }: Omit<AnimatedBackgroundProps, 'variant'>) {
  const floatingIcons = [
    { Icon: Sparkles, delay: 0, x: 10, y: 20 },
    { Icon: Zap, delay: 0.5, x: 80, y: 10 },
    { Icon: Crown, delay: 1, x: 70, y: 80 },
    { Icon: Sparkles, delay: 1.5, x: 20, y: 70 },
    { Icon: Zap, delay: 2, x: 90, y: 60 },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, 20, -10, 30],
            y: [0, -15, 25, -20],
          }}
          transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute"
          style={{
            left: `${x}%`,
            top: `${y}%`,
          }}
        >
          <Icon className="w-6 h-6 text-lime-400/20" />
        </motion.div>
      ))}

      {/* Animated Grid Pattern */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: 1 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Corner Accents */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-lime-500/10 to-transparent"
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent"
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent"
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-lime-500/10 to-transparent"
      />
    </div>
  );
}