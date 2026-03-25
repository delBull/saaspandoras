'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shadows_Into_Light } from "next/font/google";
import { cn } from "@/lib/utils";

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
});

interface AdvancedLoaderProps {
  onComplete: () => void;
  isMinting: boolean;
  alreadyOwned?: boolean;
}

const words = [
  "Validando tu wallet",
  "Activando acceso...",
  "Asignando beneficios...",
  "Sincronizando con el Growth OS",
  "Lugar asegurado.. casi listo",
];

const finalWord = "Minteado con Éxito!";
const alreadyOwnedWord = "Already Owned a Pandora's Key";

export function AdvancedLoader({ onComplete, isMinting, alreadyOwned }: AdvancedLoaderProps) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showAlreadyOwned, setShowAlreadyOwned] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (alreadyOwned) {
      setShowAlreadyOwned(true);
      setProgress(100);
      setTimeout(() => {
        onComplete();
      }, 1000);
      return;
    }

    if (!isMinting && progress >= 80 && !isFinished) {
      setProgress(100);
      setIsFinished(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [isMinting, progress, onComplete, isFinished, alreadyOwned]);

  useEffect(() => {
    if (isFinished || alreadyOwned) return;
    if (progress < 80) {
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 1, 80));
      }, 200);
      return () => clearInterval(progressInterval);
    }
  }, [progress, isFinished, alreadyOwned]);

  useEffect(() => {
    if (isFinished || alreadyOwned) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const loopSequence = [0, 1, 2, 3, 4]; // Indices of words array

    // Cleanup existing interval before starting a new one
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setIndex(prev => {
        const currentIdxInLoop = loopSequence.indexOf(prev);
        if (currentIdxInLoop === -1) return 0;
        const nextVal = loopSequence[(currentIdxInLoop + 1) % loopSequence.length];
        return typeof nextVal === 'number' ? nextVal : 0;
      });
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isFinished, alreadyOwned]);

  const displayedText = showAlreadyOwned ? alreadyOwnedWord : (isFinished ? finalWord : words[index]) ?? '';
  const isSpecialFont = displayedText === "Estamos haciendo magia" || showAlreadyOwned;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md">
      <div className="w-full h-16 text-center flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "text-lg sm:text-xl md:text-2xl font-semibold text-white",
              isSpecialFont ? shadowsIntoLight.className : "font-mono",
              showAlreadyOwned && "text-2xl md:text-3xl"
            )}
          >
            {displayedText.split(' ').map((word, i) => (
              <motion.span
                key={i}
                variants={wordVariants}
                style={{ display: 'inline-block', marginRight: '0.5rem' }}
              >
                {word}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="w-full bg-gray-700/80 rounded-full h-1.5 mt-4">
        <motion.div
          className="bg-lime-300 h-1.5 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: showAlreadyOwned ? '100%' : `${progress}%` }}
          transition={{ duration: showAlreadyOwned ? 0 : 1, ease: "linear" }}
        />
      </div>
    </div>
  );
}
