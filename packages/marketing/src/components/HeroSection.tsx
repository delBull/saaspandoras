// packages/marketing/src/components/HeroSection.tsx
'use client'

import React from 'react'

interface HeroSectionProps {
  title: string
  subtitle?: string
  description?: string
  cta?: {
    text: string
    href: string
    style?: 'primary' | 'secondary' | 'outline'
  }
  background?: {
    type: 'gradient' | 'image'
    value?: string
  }
  className?: string
}

export function HeroSection({
  title,
  subtitle,
  description,
  cta,
  background,
  className = ""
}: HeroSectionProps) {
  
  const backgroundStyle = background?.type === 'gradient' 
    ? { 
        background: background.value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    : background?.type === 'image'
    ? {
        backgroundImage: `url(${background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : {}

  return (
    <section 
      className={`min-h-screen flex items-center justify-center px-4 ${className}`}
      style={backgroundStyle}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Supertitle */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
          <span className="text-sm font-medium text-blue-400">La Evolución del Creador</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-2xl md:text-3xl mb-6 text-zinc-200">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            {description}
          </p>
        )}

        {/* CTA Button */}
        {cta && (
          <a
            href={cta.href}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 ${
              cta.style === 'primary' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg shadow-blue-500/25'
                : cta.style === 'secondary'
                ? 'bg-white text-gray-900 hover:bg-gray-100'
                : 'border-2 border-white text-white hover:bg-white hover:text-gray-900'
            }`}
          >
            {cta.text}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        )}
      </div>
    </section>
  )
}