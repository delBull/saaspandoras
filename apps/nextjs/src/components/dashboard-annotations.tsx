'use client'

import { motion } from "framer-motion"

interface AnnotationProps {
  direction: 'left' | 'right'
  label: string
  lineLength?: number
  dotSpacing?: number
  dotSize?: number
  startOffset?: number
}

export function Annotation({ 
  direction, 
  label, 
  lineLength = 100,
  dotSpacing = 6,
  dotSize = 3,
  startOffset = 0
}: AnnotationProps) {
  const isLeft = direction === 'left'
  const dots = Math.floor(lineLength / dotSpacing)
  
  const generateHandDrawnPath = (i: number) => {
    const progress = i / dots
    // Create a natural wave pattern
    const yOffset = Math.sin(progress * Math.PI * 4) * 8
    // Add some random variation for natural look
    const randomness = Math.sin(progress * Math.PI * 8) * 3
    return yOffset + randomness
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="flex items-center gap-2"
    >
      {!isLeft && (
        <motion.div
          className="rounded-lg bg-neutral-900/80 backdrop-blur-sm px-4 py-2 text-sm text-neutral-200"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          {label}
        </motion.div>
      )}
      
      <motion.div
  className="relative"
  style={{ width: lineLength, height: 100 }}
      >
        {Array.from({ length: dots }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-lime-300 rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              left: `${(i * dotSpacing * 100) / lineLength}%`,
              top: '50%',
            }}
            initial={{ 
              scale: 0,
              opacity: 0,
              y: generateHandDrawnPath(i / dots)
            }}
            animate={{ 
              scale: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
              y: [
                generateHandDrawnPath(i / dots),
                generateHandDrawnPath((i + 0.33) / dots),
                generateHandDrawnPath((i + 0.66) / dots),
                generateHandDrawnPath((i + 1) / dots)
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.03,
              ease: [0.16, 1, 0.3, 1] // Custom easing for natural movement
            }}
          />
        ))}
        
        {/* Endpoint marker with natural wobble */}
        <motion.div
          className="absolute"
          style={{
            left: isLeft ? '100%' : '0%',
            top: '50%',
            transform: `translate(${startOffset}px, -50%)`
          }}
          initial={{ scale: 0 }}
          animate={{ 
            scale: [1, 1.1, 0.9, 1],
            y: [-2, 2, -1, 1, -2],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-3 h-3 border-2 border-lime-300 rounded-full" />
        </motion.div>
      </motion.div>

      {isLeft && (
        <motion.div
          className="rounded-lg bg-neutral-900/80 backdrop-blur-sm px-4 py-2 text-sm text-neutral-200"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          {label}
        </motion.div>
      )}
    </motion.div>
  )
}