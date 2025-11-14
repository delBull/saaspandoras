// Componente MorphingText - Réplica del dashboard
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MorphingTextProps {
  text: string
  className?: string
  interval?: number
}

export function MorphingText({ text, className = '', interval = 3000 }: MorphingTextProps) {
  const [displayText, setDisplayText] = useState(text)

  useEffect(() => {
    const timer = setInterval(() => {
      // Re-animate by briefly clearing and resetting text
      setDisplayText('')
      setTimeout(() => setDisplayText(text), 100)
    }, interval)

    return () => clearInterval(timer)
  }, [text, interval])

  return (
    <motion.div
      key={displayText}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {displayText}
    </motion.div>
  )
}