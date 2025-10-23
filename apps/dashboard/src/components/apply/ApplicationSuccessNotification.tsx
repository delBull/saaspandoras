"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Sparkles,
  Crown,
  ArrowRight,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApplicationSuccessNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  title?: string;
  description?: string;
  redirectDelay?: number;
  redirectUrl?: string;
  showPartyMode?: boolean;
  className?: string;
}

export function ApplicationSuccessNotification({
  isOpen,
  onClose,
  onContinue,
  title = "¡Aplicación Enviada Exitosamente!",
  description = "Tu proyecto ha sido recibido y está siendo procesado por nuestro equipo de revisión. Te contactaremos pronto con los próximos pasos.",
  redirectDelay = 8,
  redirectUrl = "/",
  className
}: ApplicationSuccessNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(redirectDelay);
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Mostrar countdown después de 2 segundos
    const countdownTimer = setTimeout(() => {
      setShowCountdown(true);
    }, 2000);

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
          {Array.from({ length: 20 }, (_, i) => (
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
                y: [null, -100],
              }}
              transition={{
                duration: 3,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="absolute w-2 h-2 bg-lime-400 rounded-full"
            />
          ))}

          {/* Gradient orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-lime-500/20 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-emerald-500/20 to-transparent rounded-full blur-3xl"
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
            "relative max-w-2xl w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-lime-500/30 rounded-2xl shadow-2xl overflow-hidden",
            className
          )}
        >
          {/* Header with gradient border */}
          <div className="relative p-1">
            <div className="bg-gradient-to-r from-lime-500 via-emerald-500 to-green-500 rounded-xl p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center mb-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full bg-lime-400/30"
                  />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  {title}
                </h2>
                <div className="flex items-center justify-center gap-2 text-zinc-100">
                  <Crown className="w-5 h-5 text-lime-300" />
                  <span className="text-lg font-medium">Pandoras Finance</span>
                  <Crown className="w-5 h-5 text-lime-300" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center mb-8"
            >
              <p className="text-xl text-zinc-300 leading-relaxed mb-6">
                {description}
              </p>

              {/* Success Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-center justify-center gap-3 p-4 bg-lime-500/10 border border-lime-500/20 rounded-xl"
                >
                  <Sparkles className="w-5 h-5 text-lime-400" />
                  <span className="text-sm font-medium text-lime-300">Aplicación Premium</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="flex items-center justify-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                >
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Proceso Elite</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 }}
                  className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                >
                  <Star className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Seguimiento Personal</span>
                </motion.div>
              </div>

              {/* Countdown Timer */}
              {showCountdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-4 p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl"
                >
                  <Clock className="w-6 h-6 text-lime-400" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lime-400">{timeLeft}s</div>
                    <div className="text-sm text-zinc-400">Redirigiendo automáticamente</div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {onContinue && (
                <Button
                  onClick={onContinue}
                  className="bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300"
                >
                  Continuar Explorando
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-semibold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-lime-500/25"
              >
                Entendido, Gracias
              </Button>
            </motion.div>

            {/* Footer Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 }}
              className="text-center mt-6"
            >
              <p className="text-sm text-zinc-500">
                ¿Preguntas? Nuestro equipo está aquí para ayudarte
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
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-full opacity-60"
          />

          <motion.div
            animate={{
              rotate: -360,
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
            }}
            className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-60"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}