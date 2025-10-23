"use client";

import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

interface ModernBackgroundProps {
  className?: string;
  showParticles?: boolean;
  showGradient?: boolean;
  particleCount?: number;
}

interface Particle {
  left: string;
  top: string;
}

export function ModernBackground({
  className = "",
  showParticles = true,
  showGradient = true,
  particleCount = 20
}: ModernBackgroundProps) {
  const [particles, setParticles] = React.useState<Particle[]>([]);

  React.useEffect(() => {
    // Generate particle positions only on the client-side after mount
    const newParticles = Array.from({ length: particleCount }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  return (
    <div className={cn("fixed inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Gradiente de fondo animado */}
      {showGradient && (
        <>
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black"
            animate={{
              background: [
                "linear-gradient(135deg, #18181b 0%, #0a0a0a 50%, #000000 100%)",
                "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
                "linear-gradient(135deg, #18181b 0%, #0a0a0a 50%, #000000 100%)",
              ]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Orbes de luz animados */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-blue-500/10 to-transparent rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-purple-500/10 to-transparent rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.5, 0.2],
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </>
      )}

      {/* Partículas flotantes */}
      {showParticles && (
        <>
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          ))}
        </>
      )}

      {/* Líneas de conexión sutiles */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 40%, rgba(59, 130, 246, 0.1) 50%, transparent 60%),
            linear-gradient(-45deg, transparent 40%, rgba(147, 51, 234, 0.1) 50%, transparent 60%)
          `,
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}