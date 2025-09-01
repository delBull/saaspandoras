'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface FramerConfettiProps {
  amount?: number;
  coverArea?: number;
  explosion?: 'S' | 'M' | 'L' | 'XL';
  colors?: string[];
  zIndex?: number;
}

export function FramerConfetti({
  amount = 30,
  coverArea = 360,
  explosion = 'M',
  colors,
  zIndex,
}: FramerConfettiProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    // CORREGIDO: La función se mueve DENTRO del useEffect para resolver el error de dependencias.
    const triggerConfetti = () => {
      const explosionSettings = {
        S: { velocity: 5, decay: 0.95 },
        M: { velocity: 15, decay: 0.95 },
        L: { velocity: 35, decay: 0.95 },
        XL: { velocity: 60, decay: 0.95 },
      }[explosion];

      // CORREGIDO: Se añade 'void' para manejar la promesa.
      void confetti({
        particleCount: Math.floor(200 * (amount / 100)),
        spread: coverArea,
        startVelocity: explosionSettings.velocity,
        decay: explosionSettings.decay,
        scalar: 1,
        origin: { x: 0.5, y: 0.5 },
        shapes: ['circle', 'square'],
        colors: colors,
        zIndex: zIndex,
      });
    };

    if (!hasTriggered.current) {
      triggerConfetti();
      hasTriggered.current = true;
    }
  }, [explosion, amount, coverArea, colors, zIndex]); // Se añaden las props como dependencias por buena práctica

  return null;
}