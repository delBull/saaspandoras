// Componente GlassCard - Réplica del dashboard
import React from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function GlassCard({ children, className = '', delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`
        bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 
        border border-zinc-700/50 
        backdrop-blur-sm 
        rounded-xl 
        p-6 
        shadow-lg 
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}