"use client";

import { motion } from "framer-motion";
import { cn } from "@saasfly/ui";

interface MorphingTextProps {
  text: string;
  className?: string;
  hoverEffect?: boolean;
  morphOnHover?: string;
}

export function MorphingText({
  text,
  className = "",
  hoverEffect = true,
  morphOnHover
}: MorphingTextProps) {
  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      whileHover={hoverEffect ? {
        scale: 1.05,
        transition: { duration: 0.2 }
      } : undefined}
    >
      <motion.span
        className="inline-block"
        animate={{
          textShadow: [
            "0px 0px 0px rgba(59, 130, 246, 0)",
            "0px 0px 20px rgba(59, 130, 246, 0.5)",
            "0px 0px 0px rgba(59, 130, 246, 0)"
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {text}
      </motion.span>

      {hoverEffect && morphOnHover && (
        <motion.span
          className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {morphOnHover}
        </motion.span>
      )}

      {/* Efecto de partículas en hover */}
      {hoverEffect && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              initial={{
                opacity: 0,
                scale: 0,
                x: "50%",
                y: "50%"
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
              }}
              transition={{
                duration: 1,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}