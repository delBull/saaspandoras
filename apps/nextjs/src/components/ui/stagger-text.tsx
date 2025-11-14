// Componente StaggerText - Réplica del dashboard
import React from 'react'
import { motion } from 'framer-motion'

interface StaggerTextProps {
  text: string
  className?: string
  delay?: number
  staggerDelay?: number
}

export function StaggerText({ text, className = '', delay = 0, staggerDelay = 0.05 }: StaggerTextProps) {
  const words = text.split(' ')

  return (
    <div className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: delay + index * staggerDelay,
            duration: 0.5,
            ease: "easeOut"
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}