'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimate } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import Image from 'next/image';
import { cn } from '@saasfly/ui';

interface SuccessNFTCardProps {
  onAnimationComplete: () => void;
}

export function SuccessNFTCard({ onAnimationComplete }: SuccessNFTCardProps) {
  const [scope, animate] = useAnimate();
  const { width, height } = useWindowSize();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sequence = async () => {
      // Entrance animation
      if (scope.current) {
        await animate(scope.current, { opacity: 1, scale: 1, y: 0 }, { duration: 0.5, ease: "easeOut" });
      }

      // Hold for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Exit animation
      setVisible(false); // Stop confetti
      if (scope.current) {
        await animate(scope.current, 
          {
            scale: 0,
            y: height / 2 + 200, // Move down and out of screen
            x: width / 2 - 150, // Move towards the bottom right
            rotate: -30, // Add a slight rotation for style
          },
          { duration: 1.5, ease: "easeInOut" }
        );
      }
      
      // Notify parent component that animation is complete
      onAnimationComplete();
    };

    sequence();
  }, [animate, scope, onAnimationComplete, width, height]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {visible && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.2} />}
      <motion.div
        ref={scope}
        initial={{ opacity: 0, scale: 0.7, y: -100 }}
        className="w-80 h-[30rem] rounded-2xl bg-gray-900/80 backdrop-blur-lg border border-white/20 shadow-2xl shadow-cyan-500/20 flex flex-col items-center justify-center p-6"
      >
        <h2 className="text-3xl font-bold text-white mb-4">¡Llave Adquirida!</h2>
        <div className="w-56 h-56 relative mb-4">
          <Image src="/images/coin.png" layout="fill" objectFit="contain" alt="Pandora's Key" />
        </div>
        <p className="text-center text-gray-300 px-4">Tu Pandora's Key ha sido creada y guardada de forma segura en tu billetera.</p>
      </motion.div>
    </div>
  );
}
