"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGradientTextProps {
  text: string;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  textSize?: string;
}

export function AnimatedGradientText({
  text,
  className = "",
  gradientFrom = "from-blue-500",
  gradientTo = "to-purple-500",
  animationDuration = 3,
  textSize = "text-4xl md:text-6xl"
}: AnimatedGradientTextProps) {
  return (
    <motion.div
      className={cn("relative inline-block", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Texto principal con gradiente animado */}
      <motion.span
        className={cn(
          "font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
          gradientFrom,
          gradientTo,
          textSize
        )}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: animationDuration,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundSize: "200% 200%",
        }}
      >
        {text}
      </motion.span>

      {/* Efecto de brillo detrás */}
      <motion.div
        className="absolute inset-0 opacity-20 blur-xl"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: animationDuration,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background: `linear-gradient(45deg, currentColor, transparent, currentColor)`,
          backgroundSize: "200% 200%",
        }}
      />
    </motion.div>
  );
}