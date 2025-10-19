"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

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
  const [isComplete, setIsComplete] = useState(false);
  const currentIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startTyping = async () => {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      // Reset state
      currentIndexRef.current = 0;
      setDisplayText("");
      setIsComplete(false);

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const currentIndex = currentIndexRef.current;
        const currentChar = text[currentIndex];

        if (currentChar !== undefined && currentIndex < text.length) {
          setDisplayText(prev => prev + currentChar);
          currentIndexRef.current = currentIndex + 1;
        } else {
          // Text is complete
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsComplete(true);

          if (repeat) {
            setTimeout(() => {
              currentIndexRef.current = 0;
              setDisplayText("");
              setIsComplete(false);
            }, 3000);
          }
        }
      }, speed);
    };

    void startTyping();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, delay, speed, repeat]);

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