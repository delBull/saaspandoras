"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  BookOpen,
  ArrowRight,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApplicationDraftNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  title?: string;
  description?: string;
  redirectDelay?: number;
  redirectUrl?: string;
  className?: string;
}

export function ApplicationDraftNotification({
  isOpen,
  onClose,
  onContinue,
  title = "¡Borrador Guardado Exitosamente!",
  description = "Tu progreso ha sido guardado de forma segura. Puedes continuar con tu aplicación en cualquier momento sin perder ningún avance.",
  redirectDelay = 5,
  redirectUrl = "/applicants",
  className
}: ApplicationDraftNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(redirectDelay);
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Mostrar countdown después de 1 segundo
    const countdownTimer = setTimeout(() => {
      setShowCountdown(true);
    }, 1000);

    // Countdown principal
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirigir automáticamente
          if (redirectUrl) {
            window.location.href = redirectUrl;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(countdownTimer);
      clearInterval(timer);
    };
  }, [isOpen, redirectUrl]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating particles */}
          {Array.from({ length: 15 }, (_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                scale: 0,
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0],
                y: [null, -80],
              }}
              transition={{
                duration: 4,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full"
            />
          ))}

          {/* Gradient orbs */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-blue-500/15 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.15, 1, 1.15],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-gradient-radial from-cyan-500/15 to-transparent rounded-full blur-3xl"
          />
        </div>

        {/* Main Notification Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
          className={cn(
            "relative max-w-lg w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden",
            className
          )}
        >
          {/* Header with gradient border */}
          <div className="relative p-1">
            <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-xl p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center mb-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full bg-blue-400/30"
                  />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                    <Save className="w-8 h-8 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {title}
                </h2>
                <div className="flex items-center justify-center gap-2 text-zinc-100">
                  <BookOpen className="w-4 h-4 text-blue-300" />
                  <span className="text-base font-medium">Borrador Seguro</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center mb-6"
            >
              <p className="text-lg text-zinc-300 leading-relaxed mb-6">
                {description}
              </p>

              {/* Draft Features */}
              <div className="grid grid-cols-1 gap-3 mb-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-center justify-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                >
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Progreso guardado automáticamente</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="flex items-center justify-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl"
                >
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">Continúa cuando quieras</span>
                </motion.div>
              </div>

              {/* Countdown Timer */}
              {showCountdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl"
                >
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">{timeLeft}s</div>
                    <div className="text-sm text-zinc-400">Redirigiendo automáticamente</div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              {onContinue && (
                <Button
                  onClick={onContinue}
                  className="bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-300"
                >
                  Continuar Aplicación
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25"
              >
                Ir a Aplicantes
              </Button>
            </motion.div>

            {/* Footer Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-center mt-4"
            >
              <p className="text-sm text-zinc-500">
                Tu progreso está seguro y disponible 24/7
              </p>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-60"
          />

          <motion.div
            animate={{
              rotate: -360,
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
            }}
            className="absolute -bottom-3 -left-3 w-5 h-5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-60"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
