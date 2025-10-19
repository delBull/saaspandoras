"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TypewriterTextProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  repeat?: boolean;
}

export function TypewriterText({
  text,
  delay = 0,
  speed = 50,
  className = "",
  repeat = false
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTyping = async () => {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        } else {
          clearInterval(typeInterval);
          setIsComplete(true);

          if (repeat) {
            setTimeout(() => {
              setDisplayText("");
              setCurrentIndex(0);
              setIsComplete(false);
            }, 3000);
          }
        }
      }, speed);

      return () => clearInterval(typeInterval);
    };

    void startTyping();
  }, [text, delay, speed, repeat, currentIndex]);

  return (
    <div className={className}>
      <span>{displayText}</span>
      {!isComplete && (
        <motion.span
          className="inline-block ml-1"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </div>
  );
}