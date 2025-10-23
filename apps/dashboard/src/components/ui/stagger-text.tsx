"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StaggerTextProps {
  text: string;
  className?: string;
  childClassName?: string;
  delay?: number;
  staggerDelay?: number;
  animationType?: "fadeInUp" | "fadeIn" | "slideIn";
}

export function StaggerText({
  text,
  className = "",
  childClassName = "",
  delay = 0,
  staggerDelay = 0.1,
  animationType = "fadeInUp"
}: StaggerTextProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay,
        staggerChildren: staggerDelay,
      },
    },
  };

  const getItemVariants = () => {
    switch (animationType) {
      case "fadeIn":
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
      case "slideIn":
        return {
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        };
      case "fadeInUp":
      default:
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        };
    }
  };

  return (
    <motion.div
      className={cn("inline-flex flex-wrap", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          className={cn("inline-block", childClassName)}
          variants={getItemVariants()}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
}