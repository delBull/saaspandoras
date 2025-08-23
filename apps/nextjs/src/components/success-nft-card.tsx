'use client';

import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FramerConfetti } from './framer-confetti';
import { Shadows_Into_Light } from "next/font/google";
import { cn } from "~/lib/utils";

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
});

interface SuccessNFTCardProps {
  onAnimationComplete: () => void;
}

export function SuccessNFTCard({ onAnimationComplete }: SuccessNFTCardProps) {
  const [visible, setVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [animationState, setAnimationState] = useState('initial');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    let timer: NodeJS.Timeout;
    if (animationState === 'initial') {
      setAnimationState('enter');
    } else if (animationState === 'enter') {
      timer = setTimeout(() => {
        setAnimationState('hold');
      }, 500); // Corresponds to enter animation duration
    } else if (animationState === 'hold') {
      timer = setTimeout(() => {
        setAnimationState('exit');
      }, 3000); // Hold duration
    } else if (animationState === 'exit') {
      setVisible(false); // Stop confetti
      timer = setTimeout(() => {
        onAnimationComplete();
      }, 1500); // Corresponds to exit animation duration
    }

    return () => clearTimeout(timer);
  }, [animationState, isPaused, onAnimationComplete]);

  const cardVariants: Variants = {
    initial: { opacity: 0, scale: 0.7, y: -100 },
    enter: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    hold: { opacity: 1, scale: 1, y: 0 },
    exit: {
      scale: 0,
      y: 500, // Adjusted for a smoother exit
      x: 500,
      rotate: -30,
      transition: { duration: 1.5, ease: 'easeInOut' },
    },
  };

  const confettiColors = ['#3B0066', '#000080', '#F3F4F6'];

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center">
      {isClient && visible && (
        <FramerConfetti
          colors={confettiColors}
          amount={80}
          coverArea={180}
          zIndex={0}
          explosion='L'
        />
      )}
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate={animationState}
        className="w-80 h-[30rem] rounded-2xl flex flex-col items-center justify-center p-6 z-10"
        style={{
          background: "linear-gradient(to bottom right, rgba(123, 27, 116, 0.8), rgba(180, 80, 170, 0.2))",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "2px solid rgba(255,255,255,0.3)",
        }}
      >
        <h2 className={cn(shadowsIntoLight.className, "text-3xl font-bold text-white mb-4")}>¡Llave Adquirida!</h2>
        <div className="w-56 h-56 relative mb-4">
          <Image src="/images/pkey.png" layout="fill" objectFit="contain" alt="Pandora's Key" />
        </div>
        <p className="text-center font-mono text-gray-300 px-4">Tu Pandora's Key ha sido creada y guardada de forma segura en tu billetera.</p>
      </motion.div>
    </div>
  );
}